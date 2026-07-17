import { NextResponse } from "next/server";
import { imageSize } from "image-size";
import { requireApiRole } from "@/lib/api-auth";
import { savePublicImage } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(request: Request) {
  const { session, error } = await requireApiRole(["PUBLISHER", "ADMIN"]);
  if (error) return error;
  void session;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // MIMEタイプ偽装対策として実データから寸法・形式を検証
  let width = 0;
  let height = 0;
  try {
    const dim = imageSize(buffer);
    width = dim.width ?? 0;
    height = dim.height ?? 0;
    if (!width || !height) throw new Error("no dimensions");
  } catch {
    return NextResponse.json({ error: "invalid_image" }, { status: 400 });
  }

  const { url } = await savePublicImage(buffer, file.name || ALLOWED_TYPES[file.type]);
  return NextResponse.json({ url, width, height }, { status: 201 });
}
