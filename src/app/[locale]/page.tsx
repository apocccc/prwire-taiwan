import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("common");
  const tHome = await getTranslations("home");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">{t("siteTagline")}</h1>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">{tHome("latestNews")}</h2>
        <p className="mt-4 text-gray-600">{tHome("comingSoon")}</p>
      </section>
    </div>
  );
}
