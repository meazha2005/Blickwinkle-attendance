import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "blickwinkle_attendance_super_secret_jwt_key_2026_ztoitech";

export interface StaffPayload {
  staffId: number;
  name: string;
  phone: string;
  role: "staff" | "intern";
}

export interface AdminPayload {
  adminId: number;
  username: string;
  name: string;
  role: string;
}

export function signStaffToken(payload: StaffPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function signAdminToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyStaffToken(token: string): StaffPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as StaffPayload;
  } catch {
    return null;
  }
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch {
    return null;
  }
}

export async function getStaffFromCookies(): Promise<StaffPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("bw_staff_token")?.value;
  if (!token) return null;
  return verifyStaffToken(token);
}

export async function getAdminFromCookies(): Promise<AdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("bw_admin_token")?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export function getStaffFromRequest(req: NextRequest): StaffPayload | null {
  const cookie = req.cookies.get("bw_staff_token")?.value;
  if (cookie) {
    const verified = verifyStaffToken(cookie);
    if (verified) return verified;
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return verifyStaffToken(authHeader.substring(7));
  }
  return null;
}

export function getAdminFromRequest(req: NextRequest): AdminPayload | null {
  const cookie = req.cookies.get("bw_admin_token")?.value;
  if (cookie) {
    const verified = verifyAdminToken(cookie);
    if (verified) return verified;
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return verifyAdminToken(authHeader.substring(7));
  }
  return null;
}
