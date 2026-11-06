import { NextRequest, NextResponse } from "next/server";
import { getStaffFromCookies } from "@/lib/auth";
import { query, queryOne, execute } from "@/lib/db";
import { uploadSelfieImage } from "@/lib/upload";
import { reverseGeocode, calculateDistanceMeters } from "@/lib/geo";

export async function POST(req: NextRequest) {
  try {
    const session = await getStaffFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized. Please login again." }, { status: 401 });
    }

    const body = await req.json();
    const { action, selfie, latitude, longitude, accuracy, deviceInfo } = body;

    if (!action || (action !== "check_in" && action !== "check_out")) {
      return NextResponse.json({ success: false, message: "Invalid action. Must be check_in or check_out." }, { status: 400 });
    }

    // 1. Strict Location Validation
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      isNaN(latitude) ||
      isNaN(longitude) ||
      (latitude === 0 && longitude === 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Location is required. Please turn on device GPS and allow location permission in your browser.",
        },
        { status: 400 }
      );
    }

    // 2. Strict Selfie Camera Validation
    if (!selfie || typeof selfie !== "string" || selfie.length < 500) {
      return NextResponse.json(
        {
          success: false,
          message: "Selfie photo is required. Please allow camera permission and take a front-camera selfie.",
        },
        { status: 400 }
      );
    }

    // Determine current date & time (IST)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const todayStr = istNow.toISOString().split("T")[0];
    const timeStr = istNow.toISOString().split("T")[1].substring(0, 8); // "HH:mm:ss"

    // Fetch office settings (for geofence only)
    const settingsRows = await query<any>(
      `SELECT setting_key, setting_value FROM blickwinkle_attendance_settings`
    );
    const settings: Record<string, string> = {};
    settingsRows.forEach((r) => {
      settings[r.setting_key] = r.setting_value;
    });

    const strictGeofence = settings.strict_geofence === "1";
    const officeLat = parseFloat(settings.office_latitude || "13.0827");
    const officeLon = parseFloat(settings.office_longitude || "80.2707");
    const officeRadius = parseFloat(settings.office_radius_meters || "250");

    // Check geofence if strictly enabled
    if (strictGeofence) {
      const distance = calculateDistanceMeters(latitude, longitude, officeLat, officeLon);
      if (distance > officeRadius) {
        return NextResponse.json(
          {
            success: false,
            message: `You are ${(distance).toFixed(0)}m away from the office. Strict geofence allows within ${officeRadius}m.`,
          },
          { status: 403 }
        );
      }
    }

    // Check existing record for today
    const existing = await queryOne<any>(
      `SELECT * FROM blickwinkle_attendance_records WHERE staff_id = ? AND date = ?`,
      [session.staffId, todayStr]
    );

    // Fetch staff member's specific attendance timing parameters
    const staffMember = await queryOne<any>(
      `SELECT timing_type, work_start_time, work_end_time, late_grace_period_minutes 
       FROM blickwinkle_attendance_staffs 
       WHERE id = ?`,
      [session.staffId]
    );

    const timingType = staffMember?.timing_type || "fixed";
    const staffStart = staffMember?.work_start_time
      ? String(staffMember.work_start_time).substring(0, 5)
      : "09:30";
    const graceMins =
      staffMember?.late_grace_period_minutes !== undefined && staffMember?.late_grace_period_minutes !== null
        ? Number(staffMember.late_grace_period_minutes)
        : 30;

    // Upload selfie image
    const uploadRes = await uploadSelfieImage(selfie, session.staffId, action);
    if (!uploadRes.success || !uploadRes.url) {
      return NextResponse.json(
        {
          success: false,
          message: uploadRes.error || "Failed to upload selfie photo. Please try again.",
        },
        { status: 500 }
      );
    }

    // Reverse geocode location
    const formattedAddress = await reverseGeocode(latitude, longitude);

    if (action === "check_in") {
      if (existing && existing.check_in_time) {
        return NextResponse.json(
          { success: false, message: "You have already checked in for today." },
          { status: 400 }
        );
      }

      // Calculate if Late:
      let status = "present";
      if (timingType === "any_time") {
        // Any Time: No late mark ever. Check in anytime!
        status = "present";
      } else {
        // Fixed Timing: compare timeStr (HH:mm:ss) with staffStart + graceMins
        const [startH, startM] = staffStart.split(":").map(Number);
        const graceThresholdMinutes = (startH || 9) * 60 + (startM || 30) + graceMins;
        const [currH, currM] = timeStr.split(":").map(Number);
        const currMinutes = currH * 60 + currM;

        status = currMinutes > graceThresholdMinutes ? "late" : "present";
      }

      await execute(
        `INSERT INTO blickwinkle_attendance_records 
         (staff_id, date, check_in_time, check_in_selfie_url, check_in_latitude, check_in_longitude, check_in_accuracy, check_in_address, status, device_info)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           check_in_time = VALUES(check_in_time),
           check_in_selfie_url = VALUES(check_in_selfie_url),
           check_in_latitude = VALUES(check_in_latitude),
           check_in_longitude = VALUES(check_in_longitude),
           check_in_accuracy = VALUES(check_in_accuracy),
           check_in_address = VALUES(check_in_address),
           status = VALUES(status),
           device_info = VALUES(device_info)`,
        [
          session.staffId,
          todayStr,
          timeStr,
          uploadRes.url,
          latitude,
          longitude,
          accuracy || 10,
          formattedAddress,
          status,
          deviceInfo || "Mobile Browser",
        ]
      );

      return NextResponse.json({
        success: true,
        message: status === "late" ? "Checked in successfully (Marked as Late)." : "Checked in successfully!",
        time: timeStr,
        status,
        selfieUrl: uploadRes.url,
        address: formattedAddress,
      });
    } else {
      // action === 'check_out'
      if (!existing || !existing.check_in_time) {
        return NextResponse.json(
          { success: false, message: "You must check in first before checking out." },
          { status: 400 }
        );
      }

      if (existing.check_out_time) {
        return NextResponse.json(
          { success: false, message: "You have already checked out for today." },
          { status: 400 }
        );
      }

      // Calculate duration in minutes
      const [inH, inM, inS] = (existing.check_in_time as string).split(":").map(Number);
      const [outH, outM, outS] = timeStr.split(":").map(Number);

      const inTotalSeconds = inH * 3600 + inM * 60 + (inS || 0);
      const outTotalSeconds = outH * 3600 + outM * 60 + (outS || 0);
      const diffMinutes = Math.max(0, Math.floor((outTotalSeconds - inTotalSeconds) / 60));

      let newStatus = existing.status;
      if (timingType !== "any_time" && diffMinutes < 240 && newStatus === "present") {
        newStatus = "half_day";
      }

      await execute(
        `UPDATE blickwinkle_attendance_records 
         SET check_out_time = ?,
             check_out_selfie_url = ?,
             check_out_latitude = ?,
             check_out_longitude = ?,
             check_out_accuracy = ?,
             check_out_address = ?,
             work_duration_minutes = ?,
             status = ?
         WHERE id = ?`,
        [
          timeStr,
          uploadRes.url,
          latitude,
          longitude,
          accuracy || 10,
          formattedAddress,
          diffMinutes,
          newStatus,
          existing.id,
        ]
      );

      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      const durationFormatted = `${hours}h ${mins}m`;

      return NextResponse.json({
        success: true,
        message: `Checked out successfully! Total work duration: ${durationFormatted}`,
        time: timeStr,
        workDurationMinutes: diffMinutes,
        durationFormatted,
        status: newStatus,
        selfieUrl: uploadRes.url,
        address: formattedAddress,
      });
    }
  } catch (err: any) {
    console.error("Mark attendance error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to record attendance." },
      { status: 500 }
    );
  }
}
