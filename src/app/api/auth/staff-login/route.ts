import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryOne } from "@/lib/db";
import { signStaffToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let phone = (body.phone || "").trim().replace(/\D/g, "");
    const password = (body.password || "").trim();

    // If phone has country code +91 and 12 digits, strip to 10
    if (phone.length === 12 && phone.startsWith("91")) {
      phone = phone.substring(2);
    }

    if (phone.length !== 10) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, message: "Please enter your password." },
        { status: 400 }
      );
    }

    // Look up staff
    const staff = await queryOne<any>(
      `SELECT id, name, phone, password_hash, address, aadhar_no, role, status 
       FROM blickwinkle_attendance_staffs 
       WHERE phone = ?`,
      [phone]
    );

    if (!staff) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number or password.",
        },
        { status: 401 }
      );
    }

    if (!staff.password_hash) {
      return NextResponse.json(
        {
          success: false,
          message: "Password is not set for this account. Please contact administrator.",
        },
        { status: 401 }
      );
    }

    // Compare bcrypt password hash
    const isMatch = await bcrypt.compare(password, staff.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number or password.",
        },
        { status: 401 }
      );
    }

    if (staff.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is marked inactive. Please contact the administrator.",
        },
        { status: 403 }
      );
    }

    // Issue token
    const token = signStaffToken({
      staffId: staff.id,
      name: staff.name,
      phone: staff.phone,
      role: staff.role,
    });

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${staff.name}!`,
      staff: {
        id: staff.id,
        name: staff.name,
        phone: staff.phone,
        role: staff.role,
      },
    });

    response.cookies.set("bw_staff_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Staff login error:", err);
    return NextResponse.json(
      { success: false, message: "An error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
