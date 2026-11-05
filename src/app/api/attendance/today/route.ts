import { NextResponse } from "next/server";
import { getStaffFromCookies } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export async function GET() {
  try {
    const session = await getStaffFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Get today's local date (YYYY-MM-DD)
    const now = new Date();
    // Use Indian Standard Time or server offset
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const todayStr = istDate.toISOString().split("T")[0];

    // Fetch today's record
    const record = await queryOne<any>(
      `SELECT * FROM blickwinkle_attendance_records 
       WHERE staff_id = ? AND date = ?`,
      [session.staffId, todayStr]
    );

    // Fetch office settings
    const settingsRows = await query<any>(
      `SELECT setting_key, setting_value FROM blickwinkle_attendance_settings`
    );
    const settings: Record<string, string> = {};
    settingsRows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    return NextResponse.json({
      success: true,
      today: todayStr,
      record: record || null,
      settings: {
        office_name: settings.office_name || "Blickwinkle",
        work_start_time: settings.work_start_time || "09:30",
        work_end_time: settings.work_end_time || "18:30",
        grace_period_mins: parseInt(settings.grace_period_mins || "30", 10),
        strict_geofence: settings.strict_geofence === "1",
        office_latitude: parseFloat(settings.office_latitude || "13.0827"),
        office_longitude: parseFloat(settings.office_longitude || "80.2707"),
        office_radius_meters: parseFloat(settings.office_radius_meters || "250"),
      },
    });
  } catch (err: any) {
    console.error("Error fetching today's attendance:", err);
    return NextResponse.json(
      { success: false, message: "Server error fetching attendance" },
      { status: 500 }
    );
  }
}
