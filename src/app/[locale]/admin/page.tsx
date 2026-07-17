import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { formatTaipei } from "@/lib/dates";
import { approveRelease, rejectRelease } from "./actions";
import type { Locale } from "../../../../config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

/** 審査キュー */
export default async function AdminReviewQueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ["ADMIN"]);
  const t = await getTranslations("adminPanel");
  const l = locale as Locale;

  const pending = await prisma.pressRelease.findMany({
    where: { status: "IN_REVIEW" },
    include: { company: { select: { nameZh: true, nameEn: true } } },
    orderBy: { updatedAt: "asc" },
  });

  return (
    <section>
      <h2 className="text-lg font-semibold">{t("reviewQueue")}</h2>
      {pending.length === 0 ? (
        <p className="mt-4 text-gray-600">{t("noPending")}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {pending.map((r) => (
            <li key={r.id} className="rounded-lg border border-gray-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {r.titleZh || r.titleEn || "(untitled)"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {t("submittedBy")}: {r.company.nameZh}
                    {" · "}
                    {formatTaipei(r.updatedAt, l)}
                    {r.scheduledAt && (
                      <> · ⏰ {formatTaipei(r.scheduledAt, l)}</>
                    )}
                  </p>
                </div>
                <a
                  href={`/${locale}/dashboard/releases/${r.id}/preview`}
                  target="_blank"
                  className="text-sm text-blue-700 hover:underline"
                >
                  Preview ↗
                </a>
              </div>
              <div className="mt-4 flex flex-wrap items-start gap-3">
                <form action={approveRelease.bind(null, r.id)}>
                  <button
                    type="submit"
                    className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
                  >
                    {t("approve")}
                  </button>
                </form>
                <form
                  action={rejectRelease.bind(null, r.id)}
                  className="flex flex-1 items-start gap-2"
                >
                  <input
                    type="text"
                    name="reason"
                    required
                    placeholder={t("rejectReason")}
                    className="w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded border border-red-600 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    {t("reject")}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
