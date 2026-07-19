import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { formatTaipei } from "@/lib/dates";
import { MediaOutletDetailButton } from "@/components/dashboard/MediaOutletDetailButton";
import type { Locale } from "../../../../../../config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

/**
 * メディアからの反応。
 * 現状は「連絡先・メディア限定情報の開示請求」を記録・通知する
 * （どのメディアがどのリリースの情報を閲覧請求したか）。
 */
export default async function MediaActivityPage({
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

  const requests = company
    ? await prisma.disclosureRequest.findMany({
        where: { release: { companyId: company.id } },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          createdAt: true,
          release: { select: { titleZh: true, titleEn: true } },
          mediaOutlet: {
            select: {
              outletName: true,
              outletUrl: true,
              coverageArea: true,
              contactName: true,
              contactTitle: true,
              contactEmail: true,
              contactPhone: true,
            },
          },
        },
      })
    : [];

  return (
    <section>
      <h2 className="text-lg font-semibold">{t("mediaActivity")}</h2>
      <p className="mt-1 text-sm text-gray-500">{t("mediaActivityNote")}</p>

      {requests.length === 0 ? (
        <p className="mt-4 text-gray-600">{t("mediaActivityEmpty")}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">{t("requestedAt")}</th>
                <th className="py-2 pr-4 font-medium">{t("mediaOutlet")}</th>
                <th className="py-2 font-medium">{t("aboutRelease")}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-gray-200 align-top">
                  <td className="whitespace-nowrap py-3 pr-4 text-gray-500">
                    {formatTaipei(r.createdAt, l)}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0">
                        <a
                          href={r.mediaOutlet.outletUrl}
                          target="_blank"
                          rel="noopener nofollow"
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {r.mediaOutlet.outletName}
                        </a>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {r.mediaOutlet.coverageArea}
                        </span>
                      </div>
                      <MediaOutletDetailButton outlet={r.mediaOutlet} />
                    </div>
                  </td>
                  <td className="max-w-xs py-3">
                    <span className="line-clamp-2">
                      {r.release.titleZh || r.release.titleEn || "(untitled)"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
