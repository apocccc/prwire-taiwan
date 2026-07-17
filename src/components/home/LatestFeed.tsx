"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatTaipeiDate } from "@/lib/dates";
import { pick } from "@/lib/l10n";
import type { Locale } from "../../../config/site";

export interface FeedItem {
  id: string;
  slug: string;
  titleZh: string | null;
  titleEn: string | null;
  thumbnailUrl: string | null;
  thumbnailCaption: string | null;
  publishedAt: string | null;
  company: { nameZh: string; nameEn: string | null };
}

function FeedRow({ item, locale }: { item: FeedItem; locale: Locale }) {
  const title = pick(locale, item.titleZh, item.titleEn);
  const company = pick(locale, item.company.nameZh, item.company.nameEn);
  const published = item.publishedAt ? new Date(item.publishedAt) : null;

  return (
    <article className="group border-b border-gray-200 py-5">
      <Link href={`/news/${item.slug}`} className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-[#d51f1a]">
            {title}
          </h3>
          <p className="mt-2 text-xs text-gray-500">
            {published && (
              <time dateTime={published.toISOString()}>
                {formatTaipeiDate(published, locale)}
              </time>
            )}
          </p>
          <p className="line-clamp-1 text-xs text-gray-500">{company}</p>
        </div>
        {item.thumbnailUrl && (
          <div className="relative aspect-[3/2] w-28 shrink-0 overflow-hidden rounded-md bg-gray-100 sm:w-36">
            <Image
              src={item.thumbnailUrl}
              alt={item.thumbnailCaption ?? title}
              fill
              sizes="144px"
              className="object-cover"
            />
          </div>
        )}
      </Link>
    </article>
  );
}

/**
 * 新着リリースを「もっと見る」で下に追記していくフィード。
 * 初期表示分はサーバーから受け取り、以降は /api/releases/latest を叩いて追記する。
 */
export function LatestFeed({
  initialItems,
  initialHasMore,
}: {
  initialItems: FeedItem[];
  initialHasMore: boolean;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("home");
  const tCommon = useTranslations("common");

  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function loadMore() {
    setLoading(true);
    setError(false);
    const next = page + 1;
    try {
      const res = await fetch(`/api/releases/latest?locale=${locale}&page=${next}`);
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { items: FeedItem[]; hasMore: boolean };
      // slug で重複排除して追記
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.slug));
        return [...prev, ...data.items.filter((i) => !seen.has(i.slug))];
      });
      setPage(next);
      setHasMore(data.hasMore);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div>
        {items.map((item) => (
          <FeedRow key={item.id} item={item} locale={locale} />
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        {hasMore ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="rounded border border-[#d51f1a] px-8 py-2.5 text-sm font-medium text-[#d51f1a] hover:bg-[#d51f1a] hover:text-white disabled:opacity-50"
          >
            {loading ? tCommon("loading") : t("seeMore")}
          </button>
        ) : (
          <p className="text-sm text-gray-400">{t("noMore")}</p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {t("loadError")}
          </p>
        )}
      </div>
    </div>
  );
}
