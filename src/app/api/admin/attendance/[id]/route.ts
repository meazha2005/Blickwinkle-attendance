import { NextRequest, NextResponse } from "next/server";
import { getAdminFromCookies } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const recordId = parseInt(id, 10);

    const record = await queryOne<any>(
      `SELECT r.*, s.name as staff_name, s.phone as staff_phone, s.address as staff_address,
              s.aadhar_no as staff_aadhar, s.role as staff_role, s.status as staff_status
       FROM blickwinkle_attendance_records r
       JOIN blickwinkle_attendance_staffs s ON r.staff_id = s.id
       WHERE r.id = ?`,
      [recordId]
    );

    if (!record) {
      return NextResponse.json({ success: false, message: "Attendance record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    console.error("Fetch record error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
