import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, getOwnedRelease } from "@/lib/api-auth";
import { submitSchema, validateForPublish } from "@/lib/validation/release";
import { revalidateReleasePaths } from "@/lib/revalidate";
import { truncateDescription } from "@/lib/seo";
import { tiptapToPlainText } from "@/lib/tiptap-render";

/**
 * 配信申請。
 * 審査フローON: DRAFT → IN_REVIEW（管理者が承認すると公開）
 * 審査フローOFF: 即時公開（scheduledAt 指定時は SCHEDULED）
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiRole(["PUBLISHER", "ADMIN"]);
  if (error) return error;
  const { id } = await params;
  const release = await getOwnedRelease(id, session);
  if (!release) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!["DRAFT", "UNPUBLISHED"].includes(release.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = submitSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }
  const scheduledAt = parsed.data.scheduledAt
    ? new Date(parsed.data.scheduledAt)
    : null;
  if (scheduledAt && scheduledAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "scheduled_in_past" }, { status: 400 });
  }

  const publishErrors = validateForPublish(release);
  if (publishErrors.length > 0) {
    return NextResponse.json(
      { error: "publish_validation", codes: publishErrors },
      { status: 400 }
    );
  }

  // meta description 未入力なら本文冒頭から自動生成
  const metaDescriptionZh =
    release.metaDescriptionZh ||
    (release.bodyZh ? truncateDescription(tiptapToPlainText(release.bodyZh)) : null);
  const metaDescriptionEn =
    release.metaDescriptionEn ||
    (release.bodyEn ? truncateDescription(tiptapToPlainText(release.bodyEn)) : null);

  const settings = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  const reviewRequired = settings?.reviewRequired ?? true;

  let updated;
  if (reviewRequired && session.user.role !== "ADMIN") {
    updated = await prisma.pressRelease.update({
      where: { id },
      data: {
        status: "IN_REVIEW",
        scheduledAt,
        reviewNote: null,
        metaDescriptionZh,
        metaDescriptionEn,
      },
    });
    return NextResponse.json({ ok: true, status: updated.status });
  }

  // 審査不要（または管理者による申請）: 即時公開 or 予約
  if (scheduledAt) {
    updated = await prisma.pressRelease.update({
      where: { id },
      data: {
        status: "SCHEDULED",
        scheduledAt,
        publishedAt: scheduledAt,
        metaDescriptionZh,
        metaDescriptionEn,
      },
    });
  } else {
    updated = await prisma.pressRelease.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        scheduledAt: null,
        // 再公開時は初回公開日時を維持
        publishedAt: release.publishedAt ?? new Date(),
        metaDescriptionZh,
        metaDescriptionEn,
      },
    });
    revalidateReleasePaths();
  }
  return NextResponse.json({ ok: true, status: updated.status });
}
