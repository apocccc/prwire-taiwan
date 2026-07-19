import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidateReleasePaths } from "@/lib/revalidate";
import { requireApiRole, getOwnedRelease } from "@/lib/api-auth";
import {
  releaseDraftSchema,
  extractAllBodyImages,
} from "@/lib/validation/release";
import { buildReleaseSlug, extractShortId } from "@/lib/slug";
import { deletePrivateMediaKit } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiRole(["PUBLISHER", "ADMIN"]);
  if (error) return error;
  const { id } = await params;
  const release = await getOwnedRelease(id, session);
  if (!release) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ release });
}

/** 下書き保存（本文画像のキャプション未入力・10枚超過は保存自体をブロック） */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiRole(["PUBLISHER", "ADMIN"]);
  if (error) return error;
  const { id } = await params;
  const release = await getOwnedRelease(id, session);
  if (!release) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = releaseDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // 本文が送られた時のみ画像バリデーション＋同期（2ステップ保存で片方のみ送るため）
  const bodyProvided = data.bodyZh !== undefined;
  let images: { src: string; caption: string }[] = [];
  if (bodyProvided) {
    images = extractAllBodyImages({ bodyZh: data.bodyZh ?? null });
    if (images.length > 10) {
      return NextResponse.json({ error: "errTooManyImages" }, { status: 400 });
    }
    if (images.some((img) => !img.caption.trim())) {
      return NextResponse.json({ error: "errImageCaptions" }, { status: 400 });
    }
  }

  // slug: 公開前のみ変更可（公開後はURL固定）
  let slug = release.slug;
  if (
    data.customSlug !== undefined &&
    release.status !== "PUBLISHED" &&
    release.status !== "UNPUBLISHED"
  ) {
    slug = buildReleaseSlug(extractShortId(release.slug), data.customSlug);
  }

  // 送られたフィールドのみ更新（部分更新）
  const updateData: Prisma.PressReleaseUpdateInput = { slug };
  if (data.titleZh !== undefined) updateData.titleZh = data.titleZh || null;
  if (data.subtitleZh !== undefined) updateData.subtitleZh = data.subtitleZh || null;
  if (bodyProvided)
    updateData.bodyZh = (data.bodyZh ?? Prisma.DbNull) as Prisma.InputJsonValue;
  if (data.metaDescriptionZh !== undefined)
    updateData.metaDescriptionZh = data.metaDescriptionZh || null;
  if (data.purpose !== undefined) updateData.purpose = data.purpose ?? null;
  if (data.thumbnailUrl !== undefined)
    updateData.thumbnailUrl = data.thumbnailUrl || null;
  if (data.thumbnailCaption !== undefined)
    updateData.thumbnailCaption = data.thumbnailCaption || null;
  if (data.pressContactDept !== undefined)
    updateData.pressContactDept = data.pressContactDept || null;
  if (data.pressContactName !== undefined)
    updateData.pressContactName = data.pressContactName || null;
  if (data.pressContactEmail !== undefined)
    updateData.pressContactEmail = data.pressContactEmail || null;
  if (data.pressContactPhone !== undefined)
    updateData.pressContactPhone = data.pressContactPhone || null;

  const updated = await prisma.$transaction(async (tx) => {
    // 本文画像をReleaseImageへ同期（本文が送られた時のみ）
    if (bodyProvided) {
      await tx.releaseImage.deleteMany({ where: { releaseId: id } });
      if (images.length > 0) {
        await tx.releaseImage.createMany({
          data: images.map((img, i) => ({
            releaseId: id,
            url: img.src,
            caption: img.caption,
            sortOrder: i,
          })),
        });
      }
    }

    // カテゴリ同期
    if (data.categoryIds) {
      await tx.releaseCategory.deleteMany({ where: { releaseId: id } });
      if (data.categoryIds.length > 0) {
        await tx.releaseCategory.createMany({
          data: data.categoryIds.map((categoryId) => ({ releaseId: id, categoryId })),
          skipDuplicates: true,
        });
      }
    }

    // メディア限定情報
    if (data.mediaOnlyInfo !== undefined) {
      if (data.mediaOnlyInfo) {
        await tx.mediaOnlyInfo.upsert({
          where: { releaseId: id },
          update: { content: data.mediaOnlyInfo },
          create: { releaseId: id, content: data.mediaOnlyInfo },
        });
      } else {
        await tx.mediaOnlyInfo.deleteMany({ where: { releaseId: id } });
      }
    }

    return tx.pressRelease.update({ where: { id }, data: updateData });
  });

  // 公開中リリースの編集は即時反映
  if (updated.status === "PUBLISHED") {
    revalidateReleasePaths();
  }

  return NextResponse.json({ ok: true, slug: updated.slug });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiRole(["PUBLISHER", "ADMIN"]);
  if (error) return error;
  const { id } = await params;
  const release = await getOwnedRelease(id, session);
  if (!release) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // 公開中は削除不可（先に非公開化する）。管理者は無条件で削除可。
  if (release.status === "PUBLISHED" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "unpublish_first" }, { status: 400 });
  }

  for (const f of release.mediaKitFiles) {
    await deletePrivateMediaKit(f.fileKey);
  }
  await prisma.pressRelease.delete({ where: { id } });
  revalidateReleasePaths();
  return NextResponse.json({ ok: true });
}
