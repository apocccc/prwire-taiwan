import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Pagination } from "@/components/Pagination";
import { ReleaseGrid } from "@/components/ReleaseCard";
import { getCategoryBySlug, getReleasesByCategory } from "@/lib/queries";
import { pick } from "@/lib/l10n";
import type { Locale } from "../../../../../config/site";

export async function CategoryList({
  locale,
  slug,
  page,
}: {
  locale: Locale;
  slug: string;
  page: number;
}) {
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const t = await getTranslations("category");
  const tNav = await getTranslations("nav");
  const tNews = await getTranslations("news");
  const { items, totalPages } = await getReleasesByCategory(category.id, page);
  if (page > 1 && items.length === 0) notFound();

  const name = pick(locale, category.nameZh, category.nameEn);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs
        locale={locale}
        items={[
          { name: tNav("home"), path: "/" },
          { name: tNews("listTitle"), path: "/news" },
          { name },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold">
        {t("listTitle", { name })}
        {page > 1 && ` — ${tNews("pageN", { page })}`}
      </h1>
      <div className="mt-6">
        {items.length > 0 ? (
          <ReleaseGrid releases={items} locale={locale} priorityCount={3} />
        ) : (
          <p className="text-gray-600">{tNews("empty")}</p>
        )}
      </div>
      <Pagination
        basePath={`/category/${slug}`}
        currentPage={page}
        totalPages={totalPages}
      />
    </div>
  );
}
