import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { formatTaipeiDate } from "@/lib/dates";
import { articlePath } from "@/lib/article-url";
import type { Locale } from "../../../../../config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

/** 簡易アナリティクス（記事別PV） */
export default async function AdminAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ["ADMIN"]);
  const t = await getTranslations("adminPanel");
  const l = locale as Locale;

  const releases = await prisma.pressRelease.findMany({
    where: { status: { in: ["PUBLISHED", "SCHEDULED", "UNPUBLISHED"] } },
    select: {
      id: true,
      seq: true,
      slug: true,
      titleZh: true,
      titleEn: true,
      viewCount: true,
      publishedAt: true,
      company: { select: { seq: true, nameZh: true } },
    },
    orderBy: { viewCount: "desc" },
    take: 100,
  });

  const totalViews = releases.reduce((sum, r) => sum + r.viewCount, 0);

  return (
    <section>
      <h2 className="text-lg font-semibold">{t("viewsByRelease")}</h2>
      <p className="mt-2 text-sm text-gray-500">Total PV: {totalViews.toLocaleString()}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left text-gray-500">
              <th className="py-2 pr-4 font-medium">#</th>
              <th className="py-2 pr-4 font-medium">Title</th>
              <th className="py-2 pr-4 font-medium">Company</th>
              <th className="py-2 pr-4 font-medium">Published</th>
              <th className="py-2 font-medium">PV</th>
            </tr>
          </thead>
          <tbody>
            {releases.map((r, i) => (
              <tr key={r.id} className="border-b border-gray-200">
                <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                <td className="max-w-md py-2 pr-4">
                  <a
                    href={`/${locale}${articlePath(r)}`}
                    target="_blank"
                    className="line-clamp-1 text-blue-700 hover:underline"
                  >
                    {r.titleZh || r.titleEn || "(untitled)"}
                  </a>
                </td>
                <td className="py-2 pr-4">{r.company.nameZh}</td>
                <td className="whitespace-nowrap py-2 pr-4 text-gray-500">
                  {r.publishedAt ? formatTaipeiDate(r.publishedAt, l) : "—"}
                </td>
                <td className="py-2 font-medium tabular-nums">{r.viewCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
