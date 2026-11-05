import { NextRequest, NextResponse } from "next/server";
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
    const address = (body.address || "").trim();
    const aadharNo = (body.aadhar_no || "").trim().replace(/\s/g, "");
    const role = body.role === "intern" ? "intern" : "staff";
    const status = body.status === "inactive" ? "inactive" : "active";

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

    await execute(
      `UPDATE blickwinkle_attendance_staffs 
       SET name = ?, phone = ?, address = ?, aadhar_no = ?, role = ?, status = ?
       WHERE id = ?`,
      [name, phone, address || null, aadharNo || null, role, status, staffId]
    );

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
