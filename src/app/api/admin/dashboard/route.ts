import { NextResponse } from "next/server";
import { getAdminFromCookies } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export async function GET() {
  try {
    const session = await getAdminFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const todayStr = istNow.toISOString().split("T")[0];

    // Total staff counts
    const totalStaffRow = await queryOne<any>(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) as staffCount,
         SUM(CASE WHEN role = 'intern' THEN 1 ELSE 0 END) as internCount
       FROM blickwinkle_attendance_staffs
       WHERE status = 'active'`
    );

    const totalActive = totalStaffRow?.total || 0;
    const staffCount = totalStaffRow?.staffCount || 0;
    const internCount = totalStaffRow?.internCount || 0;

    // Today's attendance records
    const todayRecords = await query<any>(
      `SELECT r.*, s.name as staff_name, s.phone as staff_phone, s.role as staff_role
       FROM blickwinkle_attendance_records r
       JOIN blickwinkle_attendance_staffs s ON r.staff_id = s.id
       WHERE r.date = ?
       ORDER BY r.check_in_time DESC`,
      [todayStr]
    );

    let presentToday = 0;
    let lateToday = 0;
    let halfDayToday = 0;
    let totalDurationMinutes = 0;

    todayRecords.forEach((r) => {
      if (r.status === "present") presentToday++;
      else if (r.status === "late") lateToday++;
      else if (r.status === "half_day") halfDayToday++;

      totalDurationMinutes += r.work_duration_minutes || 0;
    });

    const checkedInToday = todayRecords.length;
    const absentToday = Math.max(0, totalActive - checkedInToday);
    const attendanceRate = totalActive > 0 ? Math.round((checkedInToday / totalActive) * 100) : 0;
    const avgWorkHours =
      checkedInToday > 0 ? (totalDurationMinutes / 60 / checkedInToday).toFixed(1) : "0.0";

    return NextResponse.json({
      success: true,
      today: todayStr,
      stats: {
        totalActive,
        staffCount,
        internCount,
        checkedInToday,
        presentToday,
        lateToday,
        halfDayToday,
        absentToday,
        attendanceRate,
        avgWorkHours,
      },
      recentActivity: todayRecords.slice(0, 10),
    });
  } catch (err: any) {
    console.error("Admin dashboard error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
