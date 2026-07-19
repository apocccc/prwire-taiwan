import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";

/**
 * メディア限定情報の開示。
 * 登録メディアのみが実行でき、開示請求を記録（誰がどのリリースを見たかを事業者へ通知）した上で、
 * 採訪連絡先とメディア向け情報の実データを返す。
 * 実データは公開HTMLには一切含めず、この認可付きエンドポイント経由でのみ取得できる。
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiRole(["MEDIA"]);
  if (error) return error;
  const { id } = await params;

  const outlet = await prisma.mediaOutlet.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!outlet) {
    return NextResponse.json({ error: "no_outlet" }, { status: 403 });
  }

  const release = await prisma.pressRelease.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      pressContactDept: true,
      pressContactName: true,
      pressContactEmail: true,
      pressContactPhone: true,
      mediaOnlyInfo: { select: { content: true } },
      mediaKitFiles: {
        orderBy: { createdAt: "asc" },
        select: { id: true, fileName: true, fileSize: true },
      },
    },
  });
  if (!release || !["PUBLISHED", "SCHEDULED"].includes(release.status)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // 開示請求を記録（同一メディア×同一リリースは1件に集約）
  await prisma.disclosureRequest.upsert({
    where: {
      releaseId_mediaOutletId: { releaseId: release.id, mediaOutletId: outlet.id },
    },
    create: { releaseId: release.id, mediaOutletId: outlet.id },
    update: {},
  });

  return NextResponse.json({
    pressContact: {
      dept: release.pressContactDept,
      name: release.pressContactName,
      email: release.pressContactEmail,
      phone: release.pressContactPhone,
    },
    mediaOnlyInfo: release.mediaOnlyInfo?.content ?? null,
    mediaKitFiles: release.mediaKitFiles,
  });
}
