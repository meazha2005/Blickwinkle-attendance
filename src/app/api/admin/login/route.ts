import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryOne } from "@/lib/db";
import { signAdminToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = (body.username || "").trim();
    const password = body.password || "";

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required." },
        { status: 400 }
      );
    }

    const admin = await queryOne<any>(
      `SELECT id, username, password_hash, name, email, role 
       FROM blickwinkle_attendance_admins 
       WHERE username = ?`,
      [username]
    );

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Invalid username or password." },
        { status: 401 }
      );
    }

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return NextResponse.json(
        { success: false, message: "Invalid username or password." },
        { status: 401 }
      );
    }

    const token = signAdminToken({
      adminId: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful.",
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });

    response.cookies.set("bw_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Admin login error:", err);
    return NextResponse.json(
      { success: false, message: "An error occurred during admin login." },
      { status: 500 }
    );
  }
}
