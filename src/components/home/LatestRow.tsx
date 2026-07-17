import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { formatTaipeiDate } from "@/lib/dates";
import { pick } from "@/lib/l10n";
import type { ReleaseListItem } from "@/lib/queries";
import type { Locale } from "../../../config/site";

/** PR TIMES 風の新着リリース行（タイトル左・サムネイル右） */
export function LatestRow({
  release,
  locale,
}: {
  release: ReleaseListItem;
  locale: Locale;
}) {
  const title = pick(locale, release.titleZh, release.titleEn);
  const company = pick(locale, release.company.nameZh, release.company.nameEn);

  return (
    <article className="group border-b border-gray-200 py-5">
      <Link href={`/news/${release.slug}`} className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-[#d51f1a]">
            {title}
          </h3>
          <p className="mt-2 text-xs text-gray-500">
            {release.publishedAt && (
              <time dateTime={release.publishedAt.toISOString()}>
                {formatTaipeiDate(release.publishedAt, locale)}
              </time>
            )}
          </p>
          <p className="line-clamp-1 text-xs text-gray-500">{company}</p>
        </div>
        {release.thumbnailUrl && (
          <div className="relative aspect-[3/2] w-28 shrink-0 overflow-hidden rounded-md bg-gray-100 sm:w-36">
            <Image
              src={release.thumbnailUrl}
              alt={release.thumbnailCaption ?? title}
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
