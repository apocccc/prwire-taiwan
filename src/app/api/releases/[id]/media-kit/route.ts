import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, getOwnedRelease } from "@/lib/api-auth";
import { savePrivateMediaKit } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILES_PER_RELEASE = 10;

/** メディアキットのアップロード（非公開ストレージ、登録メディアのみDL可） */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiRole(["PUBLISHER", "ADMIN"]);
  if (error) return error;
  const { id } = await params;
  const release = await getOwnedRelease(id, session);
  if (!release) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (release.mediaKitFiles.length >= MAX_FILES_PER_RELEASE) {
    return NextResponse.json({ error: "too_many_files" }, { status: 400 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { fileKey } = await savePrivateMediaKit(buffer, file.name || "file");

  const record = await prisma.mediaKitFile.create({
    data: {
      releaseId: id,
      fileKey,
      fileName: file.name || fileKey,
      fileSize: file.size,
      mimeType: file.type,
    },
    select: { id: true, fileName: true, fileSize: true, mimeType: true },
  });

  return NextResponse.json({ file: record }, { status: 201 });
}
