import fs from "fs";
import path from "path";

export interface UploadResult {
  success: boolean;
  url: string;
  filename: string;
  error?: string;
}

export async function uploadSelfieImage(
  base64Image: string,
  staffId: number | string,
  type: "check_in" | "check_out"
): Promise<UploadResult> {
  const phpApiUrl =
    process.env.NEXT_PUBLIC_IMAGE_API_URL ||
    "https://ztoitech.com/blickwinkle/attendance/upload.php";

  // 1. Try uploading to remote PHP API at ztoitech.com (35s timeout)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    const response = await fetch(phpApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
        staff_id: staffId,
        type: type,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data && data.success && data.url) {
        return {
          success: true,
          url: data.url,
          filename: data.filename || `selfie_${Date.now()}.jpg`,
        };
      }
    }
  } catch (err) {
    console.warn("PHP Image API call failed, saving locally as fallback:", err);
  }

  // 2. Fallback: Save locally in public/uploads folder
  try {
    const targetDirs = [
      path.join(process.cwd(), "public", "uploads"),
      path.join(process.cwd(), "attendance", "public", "uploads"),
      path.resolve("D:/blickwinkle_website/attendance/public/uploads"),
      path.resolve("D:/blickwinkle_website/public/uploads"),
    ];

    const matches = base64Image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    const extension = matches && matches[1] ? matches[1].replace("jpeg", "jpg") : "jpg";
    const dataString = matches ? matches[2] : base64Image;

    const buffer = Buffer.from(dataString, "base64");
    const filename = `selfie_${type}_${staffId}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 7)}.${extension}`;

    for (const dir of targetDirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const filePath = path.join(dir, filename);
        fs.writeFileSync(filePath, buffer);
      } catch {}
    }

    return {
      success: true,
      url: `/uploads/${filename}`,
      filename,
    };
  } catch (localErr: any) {
    console.error("Local fallback upload failed:", localErr);
    return {
      success: false,
      url: "",
      filename: "",
      error: localErr.message || "Failed to save selfie image.",
    };
  }
}
