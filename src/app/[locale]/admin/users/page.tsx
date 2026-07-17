import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { formatTaipei } from "@/lib/dates";
import { setUserStatus } from "../actions";
import type { Locale } from "../../../../../config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

/** 事業者・メディアのユーザー管理（承認・停止） */
export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ["ADMIN"]);
  const t = await getTranslations("adminPanel");
  const l = locale as Locale;

  const users = await prisma.user.findMany({
    where: { role: { in: ["PUBLISHER", "MEDIA"] } },
    include: {
      company: { select: { nameZh: true, slug: true } },
      mediaOutlet: {
        select: { outletName: true, outletUrl: true, coverageArea: true, contactEmail: true },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 500,
  });

  const statusColor: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    ACTIVE: "bg-green-100 text-green-800",
    SUSPENDED: "bg-red-100 text-red-700",
  };

  return (
    <section>
      <h2 className="text-lg font-semibold">{t("users")}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left text-gray-500">
              <th className="py-2 pr-4 font-medium">{t("userEmail")}</th>
              <th className="py-2 pr-4 font-medium">{t("userRole")}</th>
              <th className="py-2 pr-4 font-medium">Profile</th>
              <th className="py-2 pr-4 font-medium">{t("userStatus")}</th>
              <th className="py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-200 align-top">
                <td className="py-3 pr-4">
                  {u.email}
                  <span className="block text-xs text-gray-400">
                    {formatTaipei(u.createdAt, l)}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {t(`roleLabels.${u.role}` as Parameters<typeof t>[0])}
                </td>
                <td className="max-w-xs py-3 pr-4 text-gray-600">
                  {u.company && <span>{u.company.nameZh}</span>}
                  {u.mediaOutlet && (
                    <span>
                      {u.mediaOutlet.outletName}
                      <span className="block text-xs text-gray-400">
                        {u.mediaOutlet.outletUrl} · {u.mediaOutlet.coverageArea}
                        <br />
                        {u.mediaOutlet.contactEmail}
                      </span>
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[u.status]}`}
                  >
                    {t(`statusLabels.${u.status}` as Parameters<typeof t>[0])}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    {u.status !== "ACTIVE" && (
                      <form action={setUserStatus.bind(null, u.id, "ACTIVE")}>
                        <button className="rounded bg-green-700 px-3 py-1 text-xs font-medium text-white hover:bg-green-600">
                          {u.status === "PENDING" ? t("approveUser") : t("activateUser")}
                        </button>
                      </form>
                    )}
                    {u.status !== "SUSPENDED" && (
                      <form action={setUserStatus.bind(null, u.id, "SUSPENDED")}>
                        <button className="rounded border border-red-600 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50">
                          {t("suspendUser")}
                        </button>
                      </form>
                    )}
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
