import { NextRequest, NextResponse } from "next/server";
import { getStaffFromCookies } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getStaffFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);

    // Default: 1st of current month
    const defaultFrom = new Date(istNow.getFullYear(), istNow.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const defaultTo = istNow.toISOString().split("T")[0];

    const fromDate = searchParams.get("from") || defaultFrom;
    const toDate = searchParams.get("to") || defaultTo;

    const records = await query<any>(
      `SELECT id, staff_id, date, check_in_time, check_in_selfie_url, check_in_address,
              check_out_time, check_out_selfie_url, check_out_address,
              work_duration_minutes, status, notes, created_at
       FROM blickwinkle_attendance_records
       WHERE staff_id = ? AND date BETWEEN ? AND ?
       ORDER BY date DESC`,
      [session.staffId, fromDate, toDate]
    );

    // Stats calculations
    let totalPresent = 0;
    let totalLate = 0;
    let totalHalfDay = 0;
    let totalWorkMinutes = 0;

    records.forEach((r) => {
      if (r.status === "present") totalPresent++;
      else if (r.status === "late") totalLate++;
      else if (r.status === "half_day") totalHalfDay++;

      totalWorkMinutes += r.work_duration_minutes || 0;
    });

    const totalHours = (totalWorkMinutes / 60).toFixed(1);

    return NextResponse.json({
      success: true,
      fromDate,
      toDate,
      records,
      stats: {
        totalRecords: records.length,
        totalPresent,
        totalLate,
        totalHalfDay,
        totalHours,
      },
    });
  } catch (err: any) {
    console.error("Attendance history error:", err);
    return NextResponse.json(
      { success: false, message: "Error fetching attendance history" },
      { status: 500 }
    );
  }
}
