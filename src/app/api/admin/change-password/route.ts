import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminFromCookies } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const currentPassword = body.currentPassword || "";
    const newPassword = body.newPassword || "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Both current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const admin = await queryOne<any>(
      `SELECT password_hash FROM blickwinkle_attendance_admins WHERE id = ?`,
      [session.adminId]
    );

    if (!admin) {
      return NextResponse.json({ success: false, message: "Admin not found." }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Current password does not match." },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await execute(
      `UPDATE blickwinkle_attendance_admins SET password_hash = ? WHERE id = ?`,
      [newHash, session.adminId]
    );

    return NextResponse.json({ success: true, message: "Password updated successfully!" });
  } catch (err: any) {
    console.error("Change password error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
