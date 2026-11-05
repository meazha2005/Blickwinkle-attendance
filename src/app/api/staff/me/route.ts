import { NextResponse } from "next/server";
import { getStaffFromCookies } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function GET() {
  try {
    const session = await getStaffFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const staff = await queryOne<any>(
      `SELECT id, name, phone, address, aadhar_no, role, status, created_at 
       FROM blickwinkle_attendance_staffs 
       WHERE id = ?`,
      [session.staffId]
    );

    if (!staff || staff.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Account inactive or not found" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        name: staff.name,
        phone: staff.phone,
        address: staff.address,
        aadhar_no: staff.aadhar_no,
        role: staff.role,
      },
    });
  } catch (err: any) {
    console.error("Error fetching staff me:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
