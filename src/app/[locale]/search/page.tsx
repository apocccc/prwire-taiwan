import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ReleaseGrid } from "@/components/ReleaseCard";
import { searchReleases } from "@/lib/queries";
import type { Locale } from "../../../../config/site";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false, follow: true } };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);
  const l = locale as Locale;

  const t = await getTranslations("searchPage");
  const tCommon = await getTranslations("common");

  const query = (q ?? "").trim().slice(0, 100);
  const results = query ? await searchReleases(query, l, 1) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <form action="" method="get" className="mt-4 flex max-w-md gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={t("placeholder")}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-gray-700"
        >
          {tCommon("search")}
        </button>
      </form>

      {results && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">{t("resultsFor", { q: query })}</h2>
          <div className="mt-4">
            {results.items.length > 0 ? (
              <ReleaseGrid releases={results.items} locale={l} />
            ) : (
              <p className="text-gray-600">{t("noResults")}</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
