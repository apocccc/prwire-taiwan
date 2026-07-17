import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";
import { getCategoryBySlug } from "@/lib/queries";
import { pick } from "@/lib/l10n";
import { CategoryList } from "./CategoryList";
import type { Locale } from "../../../../../config/site";

export const revalidate = 300;

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
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  const t = await getTranslations({ locale, namespace: "category" });
  return buildMetadata({
    locale: l,
    path: `/category/${slug}`,
    title: t("listTitle", { name: pick(l, category.nameZh, category.nameEn) }),
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  return <CategoryList locale={locale as Locale} slug={slug} page={1} />;
}
