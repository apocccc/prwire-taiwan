import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Pagination } from "@/components/Pagination";
import { ReleaseGrid } from "@/components/ReleaseCard";
import { getLatestReleases } from "@/lib/queries";
import type { Locale } from "../../../../config/site";

export async function NewsList({ locale, page }: { locale: Locale; page: number }) {
  const t = await getTranslations("news");
  const tNav = await getTranslations("nav");
  const { items, totalPages } = await getLatestReleases(locale, page);

  if (page > 1 && items.length === 0) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs
        locale={locale}
        items={[{ name: tNav("home"), path: "/" }, { name: t("listTitle") }]}
      />
      <h1 className="mt-4 text-2xl font-bold">
        {t("listTitle")}
        {page > 1 && ` — ${t("pageN", { page })}`}
      </h1>
      <div className="mt-6">
        {items.length > 0 ? (
          <ReleaseGrid releases={items} locale={locale} priorityCount={3} />
        ) : (
          <p className="text-gray-600">{t("empty")}</p>
        )}
      </div>
      <Pagination basePath="/news" currentPage={page} totalPages={totalPages} />
    </div>
  );
}
