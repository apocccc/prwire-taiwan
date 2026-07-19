import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { formatTaipei } from "@/lib/dates";
import type { Locale } from "../../../../../../config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireRole(locale, ["PUBLISHER", "ADMIN"]);
  const t = await getTranslations("dashboard");
  const l = locale as Locale;

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const releases = company
    ? await prisma.pressRelease.findMany({
        where: { companyId: company.id },
        orderBy: { viewCount: "desc" },
        select: {
          id: true,
          status: true,
          titleZh: true,
          titleEn: true,
          viewCount: true,
          publishedAt: true,
        },
        take: 200,
      })
    : [];

  const totalViews = releases.reduce((s, r) => s + r.viewCount, 0);
  const publishedCount = releases.filter((r) => r.status === "PUBLISHED").length;

  const cards = [
    { label: t("totalReleases"), value: releases.length },
    { label: t("publishedCount"), value: publishedCount },
    { label: t("totalViews"), value: totalViews },
  ];

  return (
    <section>
      <h2 className="text-lg font-semibold">{t("analytics")}</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-8 text-sm font-semibold text-gray-500">{t("viewsByRelease")}</h3>
      {releases.length === 0 ? (
        <p className="mt-3 text-gray-600">{t("empty")}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">{t("myReleases")}</th>
                <th className="py-2 pr-4 font-medium">{t("statusLabel")}</th>
                <th className="py-2 pr-4 font-medium">{t("publishedAt")}</th>
                <th className="py-2 font-medium">{t("views")}</th>
              </tr>
            </thead>
            <tbody>
              {releases.map((r) => (
                <tr key={r.id} className="border-b border-gray-200">
                  <td className="max-w-xs py-3 pr-4">
                    <span className="line-clamp-1 font-medium">
                      {r.titleZh || r.titleEn || "(untitled)"}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {t(`status.${r.status}` as Parameters<typeof t>[0])}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4 text-gray-500">
                    {r.publishedAt ? formatTaipei(r.publishedAt, l) : "—"}
                  </td>
                  <td className="py-3 tabular-nums">{r.viewCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
