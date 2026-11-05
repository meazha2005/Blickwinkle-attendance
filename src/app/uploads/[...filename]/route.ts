import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  try {
    const { filename } = await params;
    const cleanName = path.basename(filename.join("/"));

    const possiblePaths = [
      path.join(process.cwd(), "public", "uploads", cleanName),
      path.join(process.cwd(), "attendance", "public", "uploads", cleanName),
      path.resolve("D:/blickwinkle_website/attendance/public/uploads", cleanName),
      path.resolve("D:/blickwinkle_website/public/uploads", cleanName),
    ];

    let foundPath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        foundPath = p;
        break;
      }
    }

    if (!foundPath) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const ext = path.extname(foundPath).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };
    const contentType = mimeMap[ext] || "image/jpeg";

    const buffer = fs.readFileSync(foundPath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err: any) {
    return new NextResponse("Error reading image", { status: 500 });
  }
}
