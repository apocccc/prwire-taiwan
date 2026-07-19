import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { ContentEditor, type ContentInitial } from "@/components/editor/ContentEditor";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

/** ステップ1: 本文エディター */
export default async function ReleaseEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await requireRole(locale, ["PUBLISHER", "ADMIN"]);

  const release = await prisma.pressRelease.findUnique({
    where: { id },
    include: { company: { select: { userId: true } } },
  });
  if (
    !release ||
    (session.user.role !== "ADMIN" && release.company.userId !== session.user.id)
  ) {
    notFound();
  }

  const initial: ContentInitial = {
    id: release.id,
    slug: release.slug,
    status: release.status,
    titleZh: release.titleZh,
    subtitleZh: release.subtitleZh,
    bodyZh: (release.bodyZh as JSONContent | null) ?? null,
    metaDescriptionZh: release.metaDescriptionZh,
    purpose: release.purpose,
  };

  return <ContentEditor initial={initial} />;
}
