import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";
import { getCategoryBySlug } from "@/lib/queries";
import { pick } from "@/lib/l10n";
import { CategoryList } from "../../CategoryList";
import type { Locale } from "../../../../../../../config/site";

export const revalidate = 300;

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
  const category = await getCategoryBySlug(slug);
  if (!n || !category) return {};
  const t = await getTranslations({ locale, namespace: "category" });
  const tNews = await getTranslations({ locale, namespace: "news" });
  return buildMetadata({
    locale: l,
    path: `/category/${slug}/page/${n}`,
    title: `${t("listTitle", { name: pick(l, category.nameZh, category.nameEn) })} — ${tNews("pageN", { page: n })}`,
  });
}

export default async function CategoryPagedPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; page: string }>;
}) {
  const { locale, slug, page } = await params;
  setRequestLocale(locale);
  const n = parsePage(page);
  if (!n) notFound();
  return <CategoryList locale={locale as Locale} slug={slug} page={n} />;
}
