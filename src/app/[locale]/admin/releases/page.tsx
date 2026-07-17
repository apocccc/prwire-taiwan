import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { formatTaipei } from "@/lib/dates";
import {
  adminDeleteRelease,
  adminRepublishRelease,
  adminUnpublishRelease,
} from "../actions";
import type { Locale } from "../../../../../config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

/** リリース管理（全事業者横断） */
export default async function AdminReleasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ["ADMIN"]);
  const t = await getTranslations("adminPanel");
  const tDash = await getTranslations("dashboard");
  const l = locale as Locale;

  const releases = await prisma.pressRelease.findMany({
    include: { company: { select: { nameZh: true } } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <section>
      <h2 className="text-lg font-semibold">{t("releases")}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left text-gray-500">
              <th className="py-2 pr-4 font-medium">Title</th>
              <th className="py-2 pr-4 font-medium">{t("submittedBy")}</th>
              <th className="py-2 pr-4 font-medium">{tDash("statusLabel")}</th>
              <th className="py-2 pr-4 font-medium">{tDash("views")}</th>
              <th className="py-2 pr-4 font-medium">{tDash("updatedAt")}</th>
              <th className="py-2 font-medium">{tDash("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {releases.map((r) => (
              <tr key={r.id} className="border-b border-gray-200 align-top">
                <td className="max-w-xs py-3 pr-4">
                  <span className="line-clamp-2">
                    {r.titleZh || r.titleEn || "(untitled)"}
                  </span>
                </td>
                <td className="py-3 pr-4">{r.company.nameZh}</td>
                <td className="py-3 pr-4 whitespace-nowrap">
                  {tDash(`status.${r.status}` as Parameters<typeof tDash>[0])}
                </td>
                <td className="py-3 pr-4 tabular-nums">{r.viewCount}</td>
                <td className="whitespace-nowrap py-3 pr-4 text-gray-500">
                  {formatTaipei(r.updatedAt, l)}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/${locale}/dashboard/releases/${r.id}/preview`}
                      target="_blank"
                      className="text-blue-700 hover:underline"
                    >
                      Preview
                    </a>
                    {["PUBLISHED", "SCHEDULED"].includes(r.status) && (
                      <form action={adminUnpublishRelease.bind(null, r.id)}>
                        <button className="text-amber-700 hover:underline">
                          {t("unpublishRelease")}
                        </button>
                      </form>
                    )}
                    {r.status === "UNPUBLISHED" && (
                      <form action={adminRepublishRelease.bind(null, r.id)}>
                        <button className="text-green-700 hover:underline">
                          {t("publishRelease")}
                        </button>
                      </form>
                    )}
                    <form action={adminDeleteRelease.bind(null, r.id)}>
                      <button className="text-red-600 hover:underline">
                        {t("deleteRelease")}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
