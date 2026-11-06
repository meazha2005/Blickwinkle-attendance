import { NextRequest, NextResponse } from "next/server";
import { getAdminFromCookies } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { reverseGeocode } from "@/lib/geo";

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

    // Ensure all records have place names instead of raw coordinates placeholders
    for (const r of records) {
      if (
        r.check_in_latitude &&
        r.check_in_longitude &&
        (!r.check_in_address ||
          r.check_in_address.startsWith("Location:") ||
          r.check_in_address.startsWith("Coordinates:"))
      ) {
        const place = await reverseGeocode(Number(r.check_in_latitude), Number(r.check_in_longitude));
        if (place && !place.startsWith("Coordinates:") && !place.startsWith("Location:")) {
          r.check_in_address = place;
          execute(
            `UPDATE blickwinkle_attendance_records SET check_in_address = ? WHERE id = ?`,
            [place, r.id]
          ).catch(() => {});
        }
      }

      if (
        r.check_out_latitude &&
        r.check_out_longitude &&
        (!r.check_out_address ||
          r.check_out_address.startsWith("Location:") ||
          r.check_out_address.startsWith("Coordinates:"))
      ) {
        const place = await reverseGeocode(Number(r.check_out_latitude), Number(r.check_out_longitude));
        if (place && !place.startsWith("Coordinates:") && !place.startsWith("Location:")) {
          r.check_out_address = place;
          execute(
            `UPDATE blickwinkle_attendance_records SET check_out_address = ? WHERE id = ?`,
            [place, r.id]
          ).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true, count: records.length, records });
  } catch (err: any) {
    console.error("Admin attendance records error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
