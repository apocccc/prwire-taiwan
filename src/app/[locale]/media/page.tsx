import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import { getPublicMediaOutlets } from "@/lib/queries";
import type { Locale } from "../../../../config/site";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "mediaListPage" });
  return buildMetadata({
    locale: locale as Locale,
    path: "/media",
    title: t("title"),
    description: t("description"),
  });
}

export default async function MediaListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;

  const t = await getTranslations("mediaListPage");
  const tNav = await getTranslations("nav");
  const outlets = await getPublicMediaOutlets();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Breadcrumbs
        locale={l}
        items={[{ name: tNav("home"), path: "/" }, { name: t("title") }]}
      />
      <h1 className="mt-4 text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-gray-600">{t("description")}</p>

      {outlets.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left">
                <th className="py-2 pr-4 font-semibold">{t("outletName")}</th>
                <th className="py-2 pr-4 font-semibold">{t("outletUrl")}</th>
                <th className="py-2 font-semibold">{t("coverageArea")}</th>
              </tr>
            </thead>
            <tbody>
              {outlets.map((o) => (
                <tr key={o.id} className="border-b border-gray-200">
                  <td className="py-3 pr-4 font-medium">{o.outletName}</td>
                  <td className="py-3 pr-4">
                    <a
                      href={o.outletUrl}
                      rel="nofollow noopener"
                      target="_blank"
                      className="text-blue-700 hover:underline"
                    >
                      {o.outletUrl.replace(/^https?:\/\//, "")}
                    </a>
                  </td>
                  <td className="py-3 text-gray-600">{o.coverageArea}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-gray-600">{t("empty")}</p>
      )}

      <p className="mt-10 rounded-lg bg-gray-50 p-5 text-sm text-gray-700">
        {t("joinCta")}{" "}
        <Link href="/register/media" className="text-blue-700 hover:underline">
          →
        </Link>
      </p>
    </div>
  );
}
