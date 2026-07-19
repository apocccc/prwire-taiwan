import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { formatTaipeiDate } from "@/lib/dates";
import { pick } from "@/lib/l10n";
import { articlePath } from "@/lib/article-url";
import type { ReleaseListItem } from "@/lib/queries";
import type { Locale } from "../../config/site";

export function ReleaseCard({
  release,
  locale,
  priority = false,
}: {
  release: ReleaseListItem;
  locale: Locale;
  priority?: boolean;
}) {
  const title = pick(locale, release.titleZh, release.titleEn);
  const companyName = pick(locale, release.company.nameZh, release.company.nameEn);

  return (
    <article className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md">
      <Link href={articlePath(release)} className="block">
        {release.thumbnailUrl ? (
          <div className="relative aspect-[16/9] w-full bg-gray-100">
            <Image
              src={release.thumbnailUrl}
              alt={release.thumbnailCaption ?? title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-contain"
              priority={priority}
            />
          </div>
        ) : (
          <div className="aspect-[16/9] w-full bg-gray-100" />
        )}
        <div className="p-4">
          <h3 className="line-clamp-2 font-semibold group-hover:underline">
            {title}
          </h3>
          <p className="mt-2 text-xs text-gray-500">
            {companyName}
            {release.publishedAt && (
              <>
                {" · "}
                <time dateTime={release.publishedAt.toISOString()}>
                  {formatTaipeiDate(release.publishedAt, locale)}
                </time>
              </>
            )}
          </p>
        </div>
      </Link>
    </article>
  );
}

export function ReleaseGrid({
  releases,
  locale,
  priorityCount = 0,
}: {
  releases: ReleaseListItem[];
  locale: Locale;
  priorityCount?: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {releases.map((r, i) => (
        <ReleaseCard key={r.id} release={r} locale={locale} priority={i < priorityCount} />
      ))}
    </div>
  );
}
