import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { TiptapContent } from "@/lib/tiptap-render";
import { formatTaipei } from "@/lib/dates";
import { pick } from "@/lib/l10n";
import type { Locale } from "../../../../../../../config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

/** 配信前プレビュー（公開記事と同じ構造でレンダリング。所有者・管理者のみ） */
export default async function ReleasePreviewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await requireRole(locale, ["PUBLISHER", "ADMIN"]);
  const l = locale as Locale;

  const release = await prisma.pressRelease.findUnique({
    where: { id },
    include: { company: true },
  });
  if (
    !release ||
    (session.user.role !== "ADMIN" && release.company.userId !== session.user.id)
  ) {
    notFound();
  }

  const title = pick(l, release.titleZh, release.titleEn) || "(untitled)";
  const subtitle = pick(l, release.subtitleZh, release.subtitleEn);
  const body =
    l === "zh"
      ? (release.bodyZh ?? release.bodyEn)
      : (release.bodyEn ?? release.bodyZh);
  const companyName = pick(l, release.company.nameZh, release.company.nameEn);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="mb-6 rounded bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">
        PREVIEW — {release.status}
      </p>
      <article>
        <header>
          <h1 className="text-3xl font-bold leading-snug">{title}</h1>
          {subtitle && <h2 className="mt-3 text-xl text-gray-700">{subtitle}</h2>}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{companyName}</span>
            <time dateTime={(release.publishedAt ?? new Date()).toISOString()}>
              {formatTaipei(release.publishedAt ?? new Date(), l)}
            </time>
          </div>
        </header>

        {release.thumbnailUrl && (
          <figure className="mt-6">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={release.thumbnailUrl}
                alt={release.thumbnailCaption ?? title}
                fill
                sizes="768px"
                className="object-contain"
                priority
              />
            </div>
            {release.thumbnailCaption && (
              <figcaption className="mt-2 text-sm text-gray-500">
                {release.thumbnailCaption}
              </figcaption>
            )}
          </figure>
        )}

        <div className="prose-body mt-8">
          <TiptapContent doc={body} />
        </div>
      </article>
    </div>
  );
}
