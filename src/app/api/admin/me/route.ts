import { NextResponse } from "next/server";
import { getAdminFromCookies } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function GET() {
  try {
    const session = await getAdminFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const admin = await queryOne<any>(
      `SELECT id, username, name, email, role, created_at FROM blickwinkle_attendance_admins WHERE id = ?`,
      [session.adminId]
    );

    if (!admin) {
      return NextResponse.json({ success: false, message: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err: any) {
    console.error("Admin me error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
