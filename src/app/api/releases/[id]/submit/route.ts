import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, getOwnedRelease } from "@/lib/api-auth";
import { submitSchema, validateForPublish } from "@/lib/validation/release";
import { revalidateReleasePaths } from "@/lib/revalidate";
import { truncateDescription } from "@/lib/seo";
import { tiptapToPlainText } from "@/lib/tiptap-render";

/**
 * 配信。レビューは行わない。
 * scheduledAt 指定時は SCHEDULED（予約公開）、未指定なら即時 PUBLISHED。
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

  // レビューなし: 即時公開 or 予約
  let updated;
  if (scheduledAt) {
    updated = await prisma.pressRelease.update({
      where: { id },
      data: {
        status: "SCHEDULED",
        scheduledAt,
        publishedAt: scheduledAt,
        reviewNote: null,
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
        reviewNote: null,
        metaDescriptionZh,
        metaDescriptionEn,
      },
    });
    revalidateReleasePaths();
  }
  return NextResponse.json({ ok: true, status: updated.status });
}
