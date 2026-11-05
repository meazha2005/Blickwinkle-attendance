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
    const date = searchParams.get("date") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const staffId = searchParams.get("staff_id") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    let sql = `
      SELECT r.*, s.name as staff_name, s.phone as staff_phone, s.role as staff_role, s.aadhar_no as staff_aadhar
      FROM blickwinkle_attendance_records r
      JOIN blickwinkle_attendance_staffs s ON r.staff_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
      sql += ` AND r.date = ?`;
      params.push(date);
    } else {
      if (from) {
        sql += ` AND r.date >= ?`;
        params.push(from);
      }
      if (to) {
        sql += ` AND r.date <= ?`;
        params.push(to);
      }
    }

    if (staffId) {
      sql += ` AND r.staff_id = ?`;
      params.push(parseInt(staffId, 10));
    }

    if (role && (role === "staff" || role === "intern")) {
      sql += ` AND s.role = ?`;
      params.push(role);
    }

    if (status) {
      sql += ` AND r.status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (s.name LIKE ? OR s.phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY r.date DESC, r.check_in_time DESC`;

    const records = await query<any>(sql, params);

    return NextResponse.json({ success: true, count: records.length, records });
  } catch (err: any) {
    console.error("Admin attendance records error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
