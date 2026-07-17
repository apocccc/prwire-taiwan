import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { SignOutButton } from "@/components/SignOutButton";
import { NewReleaseButton, ReleaseRowActions } from "@/components/dashboard/ReleaseActions";
import { formatTaipei } from "@/lib/dates";
import { pick } from "@/lib/l10n";
import type { Locale } from "../../../../config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

export default async function DashboardPage({
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
    select: { id: true, nameZh: true, nameEn: true },
  });

  const releases = company
    ? await prisma.pressRelease.findMany({
        where: { companyId: company.id },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          slug: true,
          status: true,
          titleZh: true,
          titleEn: true,
          viewCount: true,
          updatedAt: true,
          reviewNote: true,
        },
        take: 100,
      })
    : [];

  const statusColor: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    IN_REVIEW: "bg-amber-100 text-amber-800",
    SCHEDULED: "bg-blue-100 text-blue-800",
    PUBLISHED: "bg-green-100 text-green-800",
    UNPUBLISHED: "bg-red-100 text-red-700",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex items-center gap-3">
          <NewReleaseButton locale={locale} />
          <SignOutButton locale={locale} />
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        {t("welcome")}: {company ? pick(l, company.nameZh, company.nameEn) : session.user.email}
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t("myReleases")}</h2>
        {releases.length === 0 ? (
          <p className="mt-4 text-gray-600">{t("empty")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-300 text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">{t("myReleases")}</th>
                  <th className="py-2 pr-4 font-medium">{t("statusLabel")}</th>
                  <th className="py-2 pr-4 font-medium">{t("views")}</th>
                  <th className="py-2 pr-4 font-medium">{t("updatedAt")}</th>
                  <th className="py-2 font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {releases.map((r) => (
                  <tr key={r.id} className="border-b border-gray-200 align-top">
                    <td className="max-w-xs py-3 pr-4">
                      <span className="line-clamp-2 font-medium">
                        {r.titleZh || r.titleEn || "(untitled)"}
                      </span>
                      {r.reviewNote && r.status === "DRAFT" && (
                        <span className="mt-1 block text-xs text-amber-700">
                          {t("reviewNote")}: {r.reviewNote}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[r.status]}`}
                      >
                        {t(`status.${r.status}` as Parameters<typeof t>[0])}
                      </span>
                    </td>
                    <td className="py-3 pr-4 tabular-nums">{r.viewCount}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-gray-500">
                      {formatTaipei(r.updatedAt, l)}
                    </td>
                    <td className="py-3">
                      <ReleaseRowActions releaseId={r.id} status={r.status} locale={locale} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
