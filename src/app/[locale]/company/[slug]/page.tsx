import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ReleaseGrid } from "@/components/ReleaseCard";
import { Pagination } from "@/components/Pagination";
import { JsonLd, organizationJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getCompanyBySlug, getReleasesByCompany } from "@/lib/queries";
import { pick } from "@/lib/l10n";
import { siteConfig, type Locale } from "../../../../../config/site";

export const revalidate = 600;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = locale as Locale;
  const company = await getCompanyBySlug(slug);
  if (!company) return {};
  const name = pick(l, company.nameZh, company.nameEn);
  return buildMetadata({
    locale: l,
    path: `/company/${slug}`,
    title: name,
    description: pick(l, company.descriptionZh, company.descriptionEn) || undefined,
  });
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;

  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const t = await getTranslations("company");
  const tNav = await getTranslations("nav");
  const tNews = await getTranslations("news");
  const { items, totalPages } = await getReleasesByCompany(company.id, l, 1);

  const name = pick(l, company.nameZh, company.nameEn);
  const description = pick(l, company.descriptionZh, company.descriptionEn);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd
        data={organizationJsonLd({
          name,
          url: `${siteConfig.url}/${l}/company/${company.slug}`,
          logo: company.logoUrl,
          description: description || null,
          sameAs: company.websiteUrl,
        })}
      />
      <Breadcrumbs
        locale={l}
        items={[{ name: tNav("home"), path: "/" }, { name }]}
      />

      <header className="mt-6 flex items-start gap-5">
        {company.logoUrl && (
          <Image
            src={company.logoUrl}
            alt={name}
            width={80}
            height={80}
            className="rounded-lg border border-gray-200 object-contain"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          {description && <p className="mt-2 text-gray-600">{description}</p>}
          {company.websiteUrl && (
            <p className="mt-2 text-sm">
              <a
                href={company.websiteUrl}
                rel="nofollow noopener"
                target="_blank"
                className="text-blue-700 hover:underline"
              >
                {t("website")}
              </a>
            </p>
          )}
        </div>
      </header>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">{t("listTitle", { name })}</h2>
        <div className="mt-4">
          {items.length > 0 ? (
            <ReleaseGrid releases={items} locale={l} />
          ) : (
            <p className="text-gray-600">{tNews("empty")}</p>
          )}
        </div>
        <Pagination
          basePath={`/company/${slug}`}
          currentPage={1}
          totalPages={totalPages}
        />
      </section>
    </div>
  );
}
