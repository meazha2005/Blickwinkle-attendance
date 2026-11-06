import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminFromCookies } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";

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
    const staffId = parseInt(id, 10);

    const staff = await queryOne<any>(
      `SELECT * FROM blickwinkle_attendance_staffs WHERE id = ?`,
      [staffId]
    );

    if (!staff) {
      return NextResponse.json({ success: false, message: "Staff not found" }, { status: 404 });
    }

    delete staff.password_hash;

    return NextResponse.json({ success: true, staff });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const staffId = parseInt(id, 10);
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
      return NextResponse.json({ success: false, message: "Name is required." }, { status: 400 });
    }

    if (phone.length === 12 && phone.startsWith("91")) {
      phone = phone.substring(2);
    }

    if (phone.length !== 10) {
      return NextResponse.json(
        { success: false, message: "Valid 10-digit phone number is required." },
        { status: 400 }
      );
    }

    if (password && password.length < 4) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 4 characters long." },
        { status: 400 }
      );
    }

    // Check duplicate phone with other staff
    const duplicate = await queryOne<any>(
      `SELECT id FROM blickwinkle_attendance_staffs WHERE phone = ? AND id != ?`,
      [phone, staffId]
    );
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: "Another staff or intern already uses this phone number." },
        { status: 409 }
      );
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await execute(
        `UPDATE blickwinkle_attendance_staffs 
         SET name = ?, phone = ?, password_hash = ?, address = ?, aadhar_no = ?, role = ?, timing_type = ?, work_start_time = ?, work_end_time = ?, late_grace_period_minutes = ?, status = ?
         WHERE id = ?`,
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
          staffId,
        ]
      );
    } else {
      await execute(
        `UPDATE blickwinkle_attendance_staffs 
         SET name = ?, phone = ?, address = ?, aadhar_no = ?, role = ?, timing_type = ?, work_start_time = ?, work_end_time = ?, late_grace_period_minutes = ?, status = ?
         WHERE id = ?`,
        [
          name,
          phone,
          address || null,
          aadharNo || null,
          role,
          timingType,
          workStartTime,
          workEndTime,
          lateGrace,
          status,
          staffId,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Staff member updated successfully.",
    });
  } catch (err: any) {
    console.error("Update staff error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const staffId = parseInt(id, 10);

    await execute(`DELETE FROM blickwinkle_attendance_staffs WHERE id = ?`, [staffId]);

    return NextResponse.json({
      success: true,
      message: "Staff member deleted successfully.",
    });
  } catch (err: any) {
    console.error("Delete staff error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
