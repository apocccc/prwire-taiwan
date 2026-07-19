import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { getCategories } from "@/lib/queries";
import { pick } from "@/lib/l10n";
import { SettingsStep, type SettingsInitial } from "@/components/editor/SettingsStep";
import type { Locale } from "../../../../../../../config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

/** ステップ2: 配信設定 */
export default async function ReleaseSettingsPage({
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

  const initial: SettingsInitial = {
    id: release.id,
    status: release.status,
    thumbnailUrl: release.thumbnailUrl,
    thumbnailCaption: release.thumbnailCaption,
    categoryIds: release.categories.map((c) => c.categoryId),
    mediaOnlyInfo: release.mediaOnlyInfo?.content ?? "",
    pressContactDept: release.pressContactDept,
    pressContactName: release.pressContactName,
    pressContactEmail: release.pressContactEmail,
    pressContactPhone: release.pressContactPhone,
    reviewNote: release.reviewNote,
    mediaKitFiles: release.mediaKitFiles,
  };

  return (
    <SettingsStep
      initial={initial}
      categories={categories.map((c) => ({
        id: c.id,
        label: pick(l, c.nameZh, c.nameEn),
      }))}
    />
  );
}
