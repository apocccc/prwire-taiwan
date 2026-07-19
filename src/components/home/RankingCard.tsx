import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { formatTaipeiDate } from "@/lib/dates";
import { pick } from "@/lib/l10n";
import { articlePath } from "@/lib/article-url";
import type { ReleaseListItem } from "@/lib/queries";
import type { Locale } from "../../../config/site";

/** PR TIMES 風の番号付きランキングカード（PVランキング用） */
export function RankingCard({
  release,
  rank,
  locale,
  priority = false,
}: {
  release: ReleaseListItem;
  rank: number;
  locale: Locale;
  priority?: boolean;
}) {
  const title = pick(locale, release.titleZh, release.titleEn);
  const company = pick(locale, release.company.nameZh, release.company.nameEn);

  return (
    <article className="group">
      <Link href={articlePath(release)} className="block">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md bg-gray-100">
          {release.thumbnailUrl ? (
            <Image
              src={release.thumbnailUrl}
              alt={release.thumbnailCaption ?? title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 16vw"
              className="object-contain"
              priority={priority}
            />
          ) : (
            <div className="h-full w-full bg-gray-100" />
          )}
          <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center bg-[#d51f1a] text-sm font-bold text-white">
            {rank}
          </span>
        </div>
        <h3 className="mt-2 line-clamp-3 text-sm font-semibold leading-snug group-hover:text-[#d51f1a]">
          {title}
        </h3>
        <p className="mt-1.5 text-xs text-gray-500">
          {release.publishedAt && (
            <time dateTime={release.publishedAt.toISOString()}>
              {formatTaipeiDate(release.publishedAt, locale)}
            </time>
          )}
        </p>
        <p className="line-clamp-1 text-xs text-gray-500">{company}</p>
      </Link>
    </article>
  );
}
