import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole, getOwnedRelease } from "@/lib/api-auth";
import { generateShortId } from "@/lib/slug";

/** リリースを複製して新しい下書きを作成（メディアキットは複製しない） */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiRole(["PUBLISHER", "ADMIN"]);
  if (error) return error;
  const { id } = await params;
  const release = await getOwnedRelease(id, session);
  if (!release) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const copy = await prisma.pressRelease.create({
    data: {
      companyId: release.company.id,
      slug: generateShortId(),
      status: "DRAFT",
      titleZh: release.titleZh,
      subtitleZh: release.subtitleZh,
      bodyZh: (release.bodyZh ?? Prisma.DbNull) as Prisma.InputJsonValue,
      titleEn: release.titleEn,
      subtitleEn: release.subtitleEn,
      bodyEn: (release.bodyEn ?? Prisma.DbNull) as Prisma.InputJsonValue,
      metaDescriptionZh: release.metaDescriptionZh,
      metaDescriptionEn: release.metaDescriptionEn,
      thumbnailUrl: release.thumbnailUrl,
      thumbnailCaption: release.thumbnailCaption,
      images: {
        create: release.images.map((img) => ({
          url: img.url,
          caption: img.caption,
          width: img.width,
          height: img.height,
          sortOrder: img.sortOrder,
        })),
      },
      categories: {
        create: release.categories.map((c) => ({ categoryId: c.categoryId })),
      },
      ...(release.mediaOnlyInfo
        ? { mediaOnlyInfo: { create: { content: release.mediaOnlyInfo.content } } }
        : {}),
    },
    select: { id: true },
  });

  return NextResponse.json({ id: copy.id }, { status: 201 });
}
