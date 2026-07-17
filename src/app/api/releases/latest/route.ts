import { NextResponse } from "next/server";
import { getLatestReleases } from "@/lib/queries";
import { routing } from "@/i18n/routing";
import type { Locale } from "../../../../../config/site";

/** トップページ「もっと見る」用の新着リリース追加取得（JSON） */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") ?? routing.defaultLocale;
  const locale = (
    routing.locales.includes(localeParam as Locale)
      ? localeParam
      : routing.defaultLocale
  ) as Locale;

  const pageRaw = searchParams.get("page") ?? "1";
  const page = Math.max(1, Math.min(500, parseInt(pageRaw, 10) || 1));

  const { items, totalPages } = await getLatestReleases(locale, page);

  return NextResponse.json({
    items: items.map((r) => ({
      id: r.id,
      slug: r.slug,
      titleZh: r.titleZh,
      titleEn: r.titleEn,
      thumbnailUrl: r.thumbnailUrl,
      thumbnailCaption: r.thumbnailCaption,
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
      company: { nameZh: r.company.nameZh, nameEn: r.company.nameEn },
    })),
    page,
    hasMore: page < totalPages,
  });
}
