import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LegalDocument, OperatorContact } from "@/components/LegalDocument";
import { buildMetadata } from "@/lib/seo";
import { blocks } from "@/data/legal-privacy";
import type { Locale } from "../../../../config/site";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return buildMetadata({
    locale: locale as Locale,
    path: "/privacy",
    title: t("title"),
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const t = await getTranslations("privacy");
  const tNav = await getTranslations("nav");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs
        locale={l}
        items={[{ name: tNav("home"), path: "/" }, { name: t("title") }]}
      />
      <article className="mt-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <LegalDocument blocks={blocks} />
        <OperatorContact />
      </article>
    </div>
  );
}
