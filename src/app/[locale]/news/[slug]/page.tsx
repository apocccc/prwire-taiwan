import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ViewBeacon } from "@/components/ViewBeacon";
import { JsonLd, newsArticleJsonLd } from "@/lib/jsonld";
import { buildMetadata, truncateDescription } from "@/lib/seo";
import { getReleaseBySeqs, getReleaseBySlug } from "@/lib/queries";
import { articlePath, parseArticleParam } from "@/lib/article-url";
import { TiptapContent, tiptapToPlainText } from "@/lib/tiptap-render";
import { formatTaipei } from "@/lib/dates";
import { pick } from "@/lib/l10n";
import { siteConfig, type Locale } from "../../../../../config/site";

export const revalidate = 600;

export function generateStaticParams() {
  // ビルド時のDB依存を避け、オンデマンド生成 + ISR に任せる
  return [];
}

async function getPublishedRelease(param: string, locale: Locale) {
  // PR TIMES風の {記事seq}.{会社seq}.html を優先、旧slugは後方互換で許容
  const parsed = parseArticleParam(param);
  const release = parsed
    ? await getReleaseBySeqs(parsed.releaseSeq, parsed.companySeq)
    : await getReleaseBySlug(param);
  if (
    !release ||
    !["PUBLISHED", "SCHEDULED"].includes(release.status) ||
    !release.publishedAt ||
    release.publishedAt > new Date()
  ) {
    return null;
  }
  // 該当ロケール版が無い場合は404（存在する言語のみ hreflang 相互リンク）
  const title = locale === "zh" ? release.titleZh : release.titleEn;
  if (!title) return null;
  return release;
}

function availableLocales(release: { titleZh: string | null; titleEn: string | null }): Locale[] {
  const locales: Locale[] = [];
  if (release.titleZh) locales.push("zh");
  if (release.titleEn) locales.push("en");
  return locales;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = locale as Locale;
  const release = await getPublishedRelease(slug, l);
  if (!release) return {};

  const title = pick(l, release.titleZh, release.titleEn);
  const body = l === "zh" ? release.bodyZh : release.bodyEn;
  const description =
    (l === "zh" ? release.metaDescriptionZh : release.metaDescriptionEn) ||
    truncateDescription(tiptapToPlainText(body));

  return buildMetadata({
    locale: l,
    path: articlePath(release),
    title,
    description,
    availableLocales: availableLocales(release),
    ogType: "article",
    publishedTime: release.publishedAt,
    modifiedTime: release.updatedAt,
    ogImage: release.thumbnailUrl
      ? {
          url: release.thumbnailUrl,
          width: 1200,
          height: 675,
          alt: release.thumbnailCaption ?? title,
        }
      : undefined,
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;

  const release = await getPublishedRelease(slug, l);
  if (!release) notFound();

  const t = await getTranslations("article");
  const tNav = await getTranslations("nav");
  const tNews = await getTranslations("news");

  const title = pick(l, release.titleZh, release.titleEn)!;
  const subtitle = pick(l, release.subtitleZh, release.subtitleEn);
  const body = l === "zh" ? release.bodyZh : release.bodyEn;
  const companyName = pick(l, release.company.nameZh, release.company.nameEn);
  const description =
    (l === "zh" ? release.metaDescriptionZh : release.metaDescriptionEn) ||
    truncateDescription(tiptapToPlainText(body));
  const url = `${siteConfig.url}/${l}${articlePath(release)}`;
  const primaryCategory = release.categories[0]?.category;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd
        data={newsArticleJsonLd({
          locale: l,
          url,
          headline: title,
          description,
          images: [
            ...(release.thumbnailUrl ? [absolute(release.thumbnailUrl)] : []),
            ...release.images.map((i) => absolute(i.url)),
          ],
          datePublished: release.publishedAt!,
          dateModified: release.updatedAt,
          authorName: companyName,
          authorUrl: `${siteConfig.url}/${l}/company/${release.company.slug}`,
        })}
      />
      <Breadcrumbs
        locale={l}
        items={[
          { name: tNav("home"), path: "/" },
          { name: tNews("listTitle"), path: "/news" },
          ...(primaryCategory
            ? [
                {
                  name: pick(l, primaryCategory.nameZh, primaryCategory.nameEn),
                  path: `/category/${primaryCategory.slug}`,
                },
              ]
            : []),
          { name: title },
        ]}
      />

      <article className="mt-6">
        <header>
          <h1 className="text-3xl font-bold leading-snug">{title}</h1>
          {subtitle && (
            <h2 className="mt-3 text-xl text-gray-700">{subtitle}</h2>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
            <Link
              href={`/company/${release.company.slug}`}
              className="font-medium text-gray-700 hover:underline"
            >
              {companyName}
            </Link>
            <time dateTime={release.publishedAt!.toISOString()}>
              {formatTaipei(release.publishedAt!, l)}
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
                sizes="(max-width: 768px) 100vw, 768px"
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

        {release.categories.length > 0 && (
          <footer className="mt-10 border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500">{t("categoriesLabel")}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {release.categories.map(({ category }) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="inline-block rounded-full border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    {pick(l, category.nameZh, category.nameEn)}
                  </Link>
                </li>
              ))}
            </ul>
          </footer>
        )}

        <aside className="mt-8 rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500">
            {t("companyProfile")}
          </h2>
          <p className="mt-2 font-medium">
            <Link
              href={`/company/${release.company.slug}`}
              className="hover:underline"
            >
              {companyName}
            </Link>
          </p>
          {pick(l, release.company.descriptionZh, release.company.descriptionEn) && (
            <p className="mt-2 text-sm text-gray-600">
              {pick(l, release.company.descriptionZh, release.company.descriptionEn)}
            </p>
          )}
        </aside>
      </article>
      <ViewBeacon releaseId={release.id} />
    </div>
  );
}

function absolute(url: string): string {
  return url.startsWith("http") ? url : `${siteConfig.url}${url}`;
}
