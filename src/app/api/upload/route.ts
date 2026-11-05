import { NextRequest, NextResponse } from "next/server";
import { uploadSelfieImage } from "@/lib/upload";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, staff_id, type } = body;

    if (!image) {
      return NextResponse.json({ success: false, message: "No image provided" }, { status: 400 });
    }

    const res = await uploadSelfieImage(image, staff_id || "general", type || "selfie");
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
