import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { sendEmail, disclosureNotifyEmail } from "@/lib/email";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
    select: { id: true, outletName: true },
  });
  if (!outlet) {
    return NextResponse.json({ error: "no_outlet" }, { status: 403 });
  }

  const release = await prisma.pressRelease.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      titleZh: true,
      titleEn: true,
      pressContactDept: true,
      pressContactName: true,
      pressContactEmail: true,
      pressContactPhone: true,
      company: { select: { user: { select: { email: true } } } },
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

  // 初回開示のみ記録メール送信（再開示ではスパムしない）
  const existing = await prisma.disclosureRequest.findUnique({
    where: {
      releaseId_mediaOutletId: { releaseId: release.id, mediaOutletId: outlet.id },
    },
    select: { id: true },
  });
  if (!existing) {
    await prisma.disclosureRequest.create({
      data: { releaseId: release.id, mediaOutletId: outlet.id },
    });
    const publisherEmail = release.company.user.email;
    if (publisherEmail) {
      // ベストエフォート通知（失敗しても開示自体は成功扱い）
      const mail = disclosureNotifyEmail({
        outletName: outlet.outletName,
        releaseTitle: release.titleZh || release.titleEn || "",
        dashboardUrl: `${siteUrl}/zh/dashboard/media`,
      });
      void sendEmail({ to: publisherEmail, ...mail }).catch(() => {});
    }
  }

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
