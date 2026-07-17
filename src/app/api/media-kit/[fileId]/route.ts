import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { deletePrivateMediaKit, readPrivateMediaKit } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * メディアキットのダウンロード。
 * 登録メディア（承認済み）・管理者・当該リリースの事業者本人のみ。
 * ファイルは非公開ストレージからAPI経由で配信され、直リンク不可。
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { fileId } = await params;
  const file = await prisma.mediaKitFile.findUnique({
    where: { id: fileId },
    include: {
      release: { include: { company: { select: { userId: true } } } },
    },
  });
  if (!file) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isOwner = file.release.company.userId === session.user.id;
  const allowed =
    session.user.role === "ADMIN" || session.user.role === "MEDIA" || isOwner;
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // メディアは公開済みリリースのキットのみDL可（事業者・管理者は常に可）
  if (
    session.user.role === "MEDIA" &&
    !["PUBLISHED", "SCHEDULED"].includes(file.release.status)
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let data: Buffer;
  try {
    data = await readPrivateMediaKit(file.fileKey);
  } catch {
    return NextResponse.json({ error: "file_missing" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.fileSize),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "Cache-Control": "private, no-store",
    },
  });
}

/** メディアキットの削除（リリース所有者・管理者のみ） */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { fileId } = await params;
  const file = await prisma.mediaKitFile.findUnique({
    where: { id: fileId },
    include: { release: { include: { company: { select: { userId: true } } } } },
  });
  if (!file) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isOwner = file.release.company.userId === session.user.id;
  if (session.user.role !== "ADMIN" && !isOwner) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await deletePrivateMediaKit(file.fileKey);
  await prisma.mediaKitFile.delete({ where: { id: fileId } });
  return NextResponse.json({ ok: true });
}
