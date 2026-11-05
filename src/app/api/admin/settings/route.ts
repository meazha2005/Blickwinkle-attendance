import { NextRequest, NextResponse } from "next/server";
import { getAdminFromCookies } from "@/lib/auth";
import { query, execute } from "@/lib/db";

export async function GET() {
  try {
    const session = await getAdminFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const rows = await query<any>(`SELECT setting_key, setting_value, description FROM blickwinkle_attendance_settings`);
    const settings: Record<string, string> = {};
    rows.forEach((r) => {
      settings[r.setting_key] = r.setting_value;
    });

    return NextResponse.json({
      success: true,
      settings: {
        office_name: settings.office_name || "Blickwinkle",
        work_start_time: settings.work_start_time || "09:30",
        work_end_time: settings.work_end_time || "18:30",
        grace_period_mins: settings.grace_period_mins || "30",
        strict_geofence: settings.strict_geofence || "0",
        office_latitude: settings.office_latitude || "13.0827",
        office_longitude: settings.office_longitude || "80.2707",
        office_radius_meters: settings.office_radius_meters || "250",
      },
    });
  } catch (err: any) {
    console.error("Fetch settings error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const allowedKeys = [
      "office_name",
      "work_start_time",
      "work_end_time",
      "grace_period_mins",
      "strict_geofence",
      "office_latitude",
      "office_longitude",
      "office_radius_meters",
    ];

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        await execute(
          `INSERT INTO blickwinkle_attendance_settings (setting_key, setting_value)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [key, String(body[key])]
        );
      }
    }

    return NextResponse.json({ success: true, message: "Settings updated successfully." });
  } catch (err: any) {
    console.error("Update settings error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
