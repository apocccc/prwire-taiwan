import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { MediaRegisterForm } from "./MediaRegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

export default async function MediaRegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold">{t("registerMediaTitle")}</h1>
      <MediaRegisterForm />
    </div>
  );
}
