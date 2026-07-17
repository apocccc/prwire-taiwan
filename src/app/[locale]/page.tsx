import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { JsonLd, websiteJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getCategories, getLatestReleases, getTopByViews } from "@/lib/queries";
import { RankingCard } from "@/components/home/RankingCard";
import { LatestFeed, type FeedItem } from "@/components/home/LatestFeed";
import { PER_PAGE } from "@/lib/queries";
import { pick } from "@/lib/l10n";
import type { Locale } from "../../../config/site";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale: locale as Locale, path: "/" });
}

const RANK_PERIODS = ["all", "week", "month"] as const;
type RankPeriod = (typeof RANK_PERIODS)[number];

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ rank?: string }>;
}) {
  const { locale } = await params;
  const { rank } = await searchParams;
  setRequestLocale(locale);
  const l = locale as Locale;

  const period: RankPeriod = RANK_PERIODS.includes(rank as RankPeriod)
    ? (rank as RankPeriod)
    : "all";

  const t = await getTranslations("common");
  const tHome = await getTranslations("home");
  const tNews = await getTranslations("news");

  const [ranking, latestResult, categories] = await Promise.all([
    getTopByViews(l, 6, period),
    getLatestReleases(l, 1),
    getCategories(),
  ]);

  const initialItems: FeedItem[] = latestResult.items.map((r) => ({
    id: r.id,
    slug: r.slug,
    titleZh: r.titleZh,
    titleEn: r.titleEn,
    thumbnailUrl: r.thumbnailUrl,
    thumbnailCaption: r.thumbnailCaption,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    company: { nameZh: r.company.nameZh, nameEn: r.company.nameEn },
  }));
  const initialHasMore = latestResult.total > PER_PAGE;

  const rankTabs: { key: RankPeriod; label: string }[] = [
    { key: "all", label: tHome("rankAll") },
    { key: "week", label: tHome("rankWeek") },
    { key: "month", label: tHome("rankMonth") },
  ];

  return (
    <div className="bg-white">
      <JsonLd data={websiteJsonLd(l)} />

      {/* ヒーロー見出し */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-[#d51f1a] to-[#b3160f]">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            {t("siteTagline")}
          </h1>
        </div>
      </div>

      {/* ランキング（PVベース） */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="border-l-4 border-[#d51f1a] pl-3 text-lg font-bold">
                {tHome("ranking")}
              </h2>
              <div className="flex gap-1">
                {rankTabs.map((tab) => (
                  <Link
                    key={tab.key}
                    href={
                      tab.key === "all"
                        ? "/"
                        : { pathname: "/", query: { rank: tab.key } }
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      period === tab.key
                        ? "bg-[#d51f1a] text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            </div>
            <Link href="/news" className="text-sm text-[#d51f1a] hover:underline">
              {tHome("viewAll")} →
            </Link>
          </div>

          {ranking.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
              {ranking.map((r, i) => (
                <RankingCard
                  key={r.id}
                  release={r}
                  rank={i + 1}
                  locale={l}
                  priority={i < 3}
                />
              ))}
            </div>
          ) : (
            <p className="mt-5 text-gray-500">{tNews("empty")}</p>
          )}
          <p className="mt-3 text-xs text-gray-400">{tHome("rankNote")}</p>
        </div>
      </section>

      {/* 本体: 新着 + サイドバー */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* 新着プレスリリース */}
          <section className="lg:col-span-2">
            <h2 className="border-l-4 border-[#d51f1a] pl-3 text-lg font-bold">
              {tHome("latestNews")}
            </h2>
            <div className="mt-2">
              {initialItems.length > 0 ? (
                <LatestFeed
                  initialItems={initialItems}
                  initialHasMore={initialHasMore}
                />
              ) : (
                <p className="py-6 text-gray-500">{tNews("empty")}</p>
              )}
            </div>
          </section>

          {/* サイドバー: バナー + カテゴリ */}
          <aside>
            <Link href="/register/publisher" className="block overflow-hidden rounded-lg">
              <Image
                src="/banner-taiwan.jpg"
                alt={tHome("bannerAlt")}
                width={1000}
                height={1000}
                className="h-auto w-full"
                priority
              />
            </Link>

            <div className="mt-6 rounded-lg border border-gray-200">
              <h2 className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-base font-bold">
                {tHome("categories")}
              </h2>
              <ul className="divide-y divide-gray-100">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/category/${c.slug}`}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 hover:text-[#d51f1a]"
                    >
                      <span>{pick(l, c.nameZh, c.nameEn)}</span>
                      <span className="text-gray-300">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
