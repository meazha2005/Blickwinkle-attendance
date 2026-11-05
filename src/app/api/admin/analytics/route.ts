import { NextRequest, NextResponse } from "next/server";
import { getAdminFromCookies } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);

    // Default: 30 days ago to today
    const thirtyDaysAgo = new Date(istNow.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const defaultTo = istNow.toISOString().split("T")[0];

    const fromDate = searchParams.get("from") || thirtyDaysAgo;
    const toDate = searchParams.get("to") || defaultTo;

    // 1. Overall status counts
    const statusCounts = await query<any>(
      `SELECT status, COUNT(*) as count 
       FROM blickwinkle_attendance_records 
       WHERE date BETWEEN ? AND ? 
       GROUP BY status`,
      [fromDate, toDate]
    );

    // 2. Day-by-day attendance trends
    const dailyTrends = await query<any>(
      `SELECT date,
              COUNT(*) as totalCheckedIn,
              SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as presentCount,
              SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as lateCount,
              SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as halfDayCount,
              ROUND(AVG(work_duration_minutes) / 60, 1) as avgHours
       FROM blickwinkle_attendance_records
       WHERE date BETWEEN ? AND ?
       GROUP BY date
       ORDER BY date ASC`,
      [fromDate, toDate]
    );

    // 3. Staff-by-staff breakdown
    const staffBreakdown = await query<any>(
      `SELECT s.id, s.name, s.phone, s.role,
              COUNT(r.id) as totalPresentDays,
              SUM(CASE WHEN r.status = 'late' THEN 1 ELSE 0 END) as lateDays,
              SUM(CASE WHEN r.status = 'half_day' THEN 1 ELSE 0 END) as halfDays,
              ROUND(COALESCE(SUM(r.work_duration_minutes), 0) / 60, 1) as totalHoursWorked,
              ROUND(COALESCE(AVG(r.work_duration_minutes), 0) / 60, 1) as avgDailyHours
       FROM blickwinkle_attendance_staffs s
       LEFT JOIN blickwinkle_attendance_records r ON s.id = r.staff_id AND r.date BETWEEN ? AND ?
       WHERE s.status = 'active'
       GROUP BY s.id, s.name, s.phone, s.role
       ORDER BY totalPresentDays DESC, s.name ASC`,
      [fromDate, toDate]
    );

    // 4. Role distribution
    const roleStats = await query<any>(
      `SELECT s.role, COUNT(r.id) as attendanceCount, COUNT(DISTINCT s.id) as memberCount
       FROM blickwinkle_attendance_staffs s
       LEFT JOIN blickwinkle_attendance_records r ON s.id = r.staff_id AND r.date BETWEEN ? AND ?
       GROUP BY s.role`,
      [fromDate, toDate]
    );

    return NextResponse.json({
      success: true,
      fromDate,
      toDate,
      statusCounts,
      dailyTrends,
      staffBreakdown,
      roleStats,
    });
  } catch (err: any) {
    console.error("Analytics error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
