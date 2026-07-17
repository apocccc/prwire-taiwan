import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { JSONContent } from "@tiptap/react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { getCategories } from "@/lib/queries";
import { pick } from "@/lib/l10n";
import {
  ReleaseEditor,
  type EditorRelease,
} from "@/components/editor/ReleaseEditor";
import type { Locale } from "../../../../../../config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

export default async function ReleaseEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await requireRole(locale, ["PUBLISHER", "ADMIN"]);
  const l = locale as Locale;

  const release = await prisma.pressRelease.findUnique({
    where: { id },
    include: {
      company: { select: { userId: true } },
      categories: { select: { categoryId: true } },
      mediaOnlyInfo: true,
      mediaKitFiles: {
        select: { id: true, fileName: true, fileSize: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (
    !release ||
    (session.user.role !== "ADMIN" && release.company.userId !== session.user.id)
  ) {
    notFound();
  }

  const categories = await getCategories();
  const t = await getTranslations("editor");

  const initial: EditorRelease = {
    id: release.id,
    slug: release.slug,
    status: release.status,
    titleZh: release.titleZh,
    subtitleZh: release.subtitleZh,
    bodyZh: (release.bodyZh as JSONContent | null) ?? null,
    titleEn: release.titleEn,
    subtitleEn: release.subtitleEn,
    bodyEn: (release.bodyEn as JSONContent | null) ?? null,
    metaDescriptionZh: release.metaDescriptionZh,
    metaDescriptionEn: release.metaDescriptionEn,
    thumbnailUrl: release.thumbnailUrl,
    thumbnailCaption: release.thumbnailCaption,
    reviewNote: release.reviewNote,
    categoryIds: release.categories.map((c) => c.categoryId),
    mediaOnlyInfo: release.mediaOnlyInfo?.content ?? "",
    mediaKitFiles: release.mediaKitFiles,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">
        {release.titleZh || release.titleEn ? t("editTitle") : t("newTitle")}
      </h1>
      <div className="mt-6">
        <ReleaseEditor
          initial={initial}
          categories={categories.map((c) => ({
            id: c.id,
            label: pick(l, c.nameZh, c.nameEn),
          }))}
        />
      </div>
    </div>
  );
}
