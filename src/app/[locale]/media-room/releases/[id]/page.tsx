import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { formatTaipei } from "@/lib/dates";
import { pick } from "@/lib/l10n";
import type { Locale } from "../../../../../../config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

/**
 * メディア向けリリース詳細。
 * メディア限定情報・メディアキットはこのページ（ロール検証済み）と
 * 認可付きダウンロードAPIからのみアクセス可能。
 */
export default async function MediaRoomReleasePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await requireRole(locale, ["MEDIA", "ADMIN"]);
  const t = await getTranslations("mediaRoom");
  const l = locale as Locale;

  const release = await prisma.pressRelease.findUnique({
    where: { id },
    include: {
      company: { select: { nameZh: true, nameEn: true } },
      mediaOnlyInfo: true,
      mediaKitFiles: { orderBy: { createdAt: "asc" } },
    },
  });
  if (
    !release ||
    !["PUBLISHED", "SCHEDULED"].includes(release.status) ||
    !release.publishedAt ||
    release.publishedAt > new Date()
  ) {
    notFound();
  }

  const title = pick(l, release.titleZh, release.titleEn) || "(untitled)";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-gray-500">
        ← <a href={`/${locale}/media-room`} className="hover:underline">{t("title")}</a>
      </p>
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">
        {pick(l, release.company.nameZh, release.company.nameEn)}
        {" · "}
        <time dateTime={release.publishedAt.toISOString()}>
          {formatTaipei(release.publishedAt, l)}
        </time>
        {" · "}
        <a
          href={`/${locale}/news/${release.slug}`}
          target="_blank"
          className="text-blue-700 hover:underline"
        >
          {t("viewPublic")} ↗
        </a>
      </p>

      <section className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-900">{t("mediaOnlyInfo")}</h2>
        {release.mediaOnlyInfo ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
            {release.mediaOnlyInfo.content}
          </p>
        ) : (
          <p className="mt-2 text-sm text-gray-500">{t("noInfo")}</p>
        )}
      </section>

      {release.mediaKitFiles.length > 0 && (
        <section className="mt-6 rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold">{t("mediaKit")}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {release.mediaKitFiles.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3">
                <span>
                  {f.fileName}
                  <span className="ml-2 text-xs text-gray-400">
                    {(f.fileSize / 1024 / 1024).toFixed(1)}MB
                  </span>
                </span>
                <a
                  href={`/api/media-kit/${f.id}`}
                  className="rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                >
                  {t("download")}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
