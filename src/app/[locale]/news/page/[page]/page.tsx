import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";
import { NewsList } from "../../NewsList";
import type { Locale } from "../../../../../../config/site";

export const revalidate = 300;

function parsePage(raw: string): number | null {
  if (!/^[0-9]+$/.test(raw)) return null;
  const n = parseInt(raw, 10);
  return n >= 2 ? n : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}): Promise<Metadata> {
  const { locale, page } = await params;
  const n = parsePage(page);
  if (!n) return {};
  const t = await getTranslations({ locale, namespace: "news" });
  return buildMetadata({
    locale: locale as Locale,
    path: `/news/page/${n}`,
    title: `${t("listTitle")} — ${t("pageN", { page: n })}`,
  });
}

export default async function NewsPagedPage({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}) {
  const { locale, page } = await params;
  setRequestLocale(locale);
  const n = parsePage(page);
  if (!n) notFound();
  return <NewsList locale={locale as Locale} page={n} />;
}
