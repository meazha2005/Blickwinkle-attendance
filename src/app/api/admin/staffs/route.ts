import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminFromCookies } from "@/lib/auth";
import { query, execute } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    let sql = `SELECT id, name, phone, address, aadhar_no, role, timing_type, work_start_time, work_end_time, late_grace_period_minutes, status, created_at, updated_at 
               FROM blickwinkle_attendance_staffs 
               WHERE 1=1`;
    const params: any[] = [];

    if (search) {
      sql += ` AND (name LIKE ? OR phone LIKE ? OR aadhar_no LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role && (role === "staff" || role === "intern")) {
      sql += ` AND role = ?`;
      params.push(role);
    }

    if (status && (status === "active" || status === "inactive")) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY name ASC`;

    const staffs = await query<any>(sql, params);
    return NextResponse.json({ success: true, staffs });
  } catch (err: any) {
    console.error("Fetch staffs error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = (body.name || "").trim();
    let phone = (body.phone || "").trim().replace(/\D/g, "");
    const password = (body.password || "").trim();
    const address = (body.address || "").trim();
    const aadharNo = (body.aadhar_no || "").trim().replace(/\s/g, "");
    const role = body.role === "intern" ? "intern" : "staff";
    const status = body.status === "inactive" ? "inactive" : "active";
    const timingType = body.timing_type === "any_time" ? "any_time" : "fixed";
    const workStartTime = timingType === "fixed" ? (body.work_start_time || "09:30") : null;
    const workEndTime = timingType === "fixed" ? (body.work_end_time || "18:30") : null;
    const lateGrace = timingType === "fixed" ? (parseInt(body.late_grace_period_minutes, 10) || 30) : 0;

    if (!name) {
      return NextResponse.json({ success: false, message: "Full Name is required." }, { status: 400 });
    }

    if (phone.length === 12 && phone.startsWith("91")) {
      phone = phone.substring(2);
    }

    if (phone.length !== 10) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid 10-digit phone number." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, message: "Password is required for user login." },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 4 characters long." },
        { status: 400 }
      );
    }

    if (aadharNo && (aadharNo.length < 12 || aadharNo.length > 16)) {
      return NextResponse.json(
        { success: false, message: "Aadhaar number should be 12 to 16 digits." },
        { status: 400 }
      );
    }

    // Check duplicate phone
    const existing = await query<any>(
      `SELECT id FROM blickwinkle_attendance_staffs WHERE phone = ?`,
      [phone]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: "A staff or intern with this phone number already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await execute(
      `INSERT INTO blickwinkle_attendance_staffs 
       (name, phone, password_hash, address, aadhar_no, role, timing_type, work_start_time, work_end_time, late_grace_period_minutes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        phone,
        passwordHash,
        address || null,
        aadharNo || null,
        role,
        timingType,
        workStartTime,
        workEndTime,
        lateGrace,
        status,
      ]
    );

    return NextResponse.json({
      success: true,
      message: `${role === "intern" ? "Intern" : "Staff"} added successfully.`,
      staffId: result.insertId,
    });
  } catch (err: any) {
    console.error("Create staff error:", err);
    return NextResponse.json({ success: false, message: err.message || "Server error" }, { status: 500 });
  }
}
