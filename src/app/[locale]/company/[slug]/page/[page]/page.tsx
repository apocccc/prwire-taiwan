import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ReleaseGrid } from "@/components/ReleaseCard";
import { Pagination } from "@/components/Pagination";
import { buildMetadata } from "@/lib/seo";
import { getCompanyBySlug, getReleasesByCompany } from "@/lib/queries";
import { pick } from "@/lib/l10n";
import type { Locale } from "../../../../../../../config/site";

export const revalidate = 600;

function parsePage(raw: string): number | null {
  if (!/^[0-9]+$/.test(raw)) return null;
  const n = parseInt(raw, 10);
  return n >= 2 ? n : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; page: string }>;
}): Promise<Metadata> {
  const { locale, slug, page } = await params;
  const l = locale as Locale;
  const n = parsePage(page);
  const company = await getCompanyBySlug(slug);
  if (!n || !company) return {};
  const tNews = await getTranslations({ locale, namespace: "news" });
  return buildMetadata({
    locale: l,
    path: `/company/${slug}/page/${n}`,
    title: `${pick(l, company.nameZh, company.nameEn)} — ${tNews("pageN", { page: n })}`,
  });
}

export default async function CompanyPagedPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; page: string }>;
}) {
  const { locale, slug, page } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const n = parsePage(page);
  if (!n) notFound();

  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const t = await getTranslations("company");
  const tNav = await getTranslations("nav");
  const tNews = await getTranslations("news");
  const { items, totalPages } = await getReleasesByCompany(company.id, l, n);
  if (items.length === 0) notFound();

  const name = pick(l, company.nameZh, company.nameEn);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs
        locale={l}
        items={[
          { name: tNav("home"), path: "/" },
          { name, path: `/company/${slug}` },
          { name: tNews("pageN", { page: n }) },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold">
        {t("listTitle", { name })} — {tNews("pageN", { page: n })}
      </h1>
      <div className="mt-6">
        <ReleaseGrid releases={items} locale={l} />
      </div>
      <Pagination
        basePath={`/company/${slug}`}
        currentPage={n}
        totalPages={totalPages}
      />
    </div>
  );
}
