import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { JsonLd, websiteJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getCategories, getLatestReleases } from "@/lib/queries";
import { ReleaseGrid } from "@/components/ReleaseCard";
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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;

  const t = await getTranslations("common");
  const tHome = await getTranslations("home");
  const tNews = await getTranslations("news");

  const [{ items }, categories] = await Promise.all([
    getLatestReleases(l, 1),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={websiteJsonLd(l)} />
      <h1 className="text-3xl font-bold">{t("siteTagline")}</h1>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">{tHome("latestNews")}</h2>
          <Link href="/news" className="text-sm text-blue-700 hover:underline">
            {tHome("viewAll")}
          </Link>
        </div>
        <div className="mt-4">
          {items.length > 0 ? (
            <ReleaseGrid releases={items} locale={l} priorityCount={3} />
          ) : (
            <p className="text-gray-600">{tNews("empty")}</p>
          )}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">{tHome("browseCategories")}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/category/${c.slug}`}
                  className="inline-block rounded-full border border-gray-300 px-4 py-1.5 text-sm hover:bg-gray-50"
                >
                  {pick(l, c.nameZh, c.nameEn)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
