import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PublisherRegisterForm } from "./PublisherRegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

export default async function PublisherRegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold">{t("registerPublisherTitle")}</h1>
      <PublisherRegisterForm />
    </div>
  );
}
