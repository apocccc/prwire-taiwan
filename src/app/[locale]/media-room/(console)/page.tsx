import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { formatTaipeiDate } from "@/lib/dates";
import { articlePath } from "@/lib/article-url";
import { pick } from "@/lib/l10n";
import { toggleCategoryFollow } from "./actions";
import type { Locale } from "../../../../../config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

/** メディア専区: 新着リリース一覧 + カテゴリフォロー。記事は通常の記事ページへ遷移する。 */
export default async function MediaRoomPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireRole(locale, ["MEDIA", "ADMIN"]);
  const t = await getTranslations("mediaRoom");
  const l = locale as Locale;

  const [releases, categories, outlet] = await Promise.all([
    prisma.pressRelease.findMany({
      where: {
        status: { in: ["PUBLISHED", "SCHEDULED"] },
        publishedAt: { lte: new Date() },
      },
      select: {
        id: true,
        seq: true,
        titleZh: true,
        titleEn: true,
        publishedAt: true,
        company: { select: { seq: true, nameZh: true, nameEn: true } },
        mediaOnlyInfo: { select: { releaseId: true } },
        _count: { select: { mediaKitFiles: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    session.user.role === "MEDIA"
      ? prisma.mediaOutlet.findUnique({
          where: { userId: session.user.id },
          select: { categoryFollows: { select: { categoryId: true } } },
        })
      : null,
  ]);

  const followed = new Set(outlet?.categoryFollows.map((f) => f.categoryId) ?? []);

  return (
    <div>
      {session.user.role === "MEDIA" && (
        <section className="rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold">{t("followCategories")}</h2>
          <p className="mt-1 text-sm text-gray-500">{t("followDesc")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((c) => (
              <form key={c.id} action={toggleCategoryFollow.bind(null, c.id)}>
                <button
                  type="submit"
                  className={`rounded-full border px-4 py-1.5 text-sm ${
                    followed.has(c.id)
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {followed.has(c.id) ? "✓ " : ""}
                  {pick(l, c.nameZh, c.nameEn)}
                </button>
              </form>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t("latestReleases")}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {releases.map((r) => (
                <tr key={r.id} className="border-b border-gray-200">
                  <td className="py-3 pr-4">
                    <Link
                      href={articlePath(r)}
                      className="font-medium text-blue-700 hover:underline"
                    >
                      {r.titleZh || r.titleEn || "(untitled)"}
                    </Link>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {pick(l, r.company.nameZh, r.company.nameEn)}
                      {r.publishedAt && ` · ${formatTaipeiDate(r.publishedAt, l)}`}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-3 text-right text-xs text-gray-500">
                    {r.mediaOnlyInfo && (
                      <span className="mr-2 rounded bg-amber-100 px-2 py-0.5 text-amber-800">
                        {t("mediaOnlyInfo")}
                      </span>
                    )}
                    {r._count.mediaKitFiles > 0 && (
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-800">
                        {t("mediaKit")} ({r._count.mediaKitFiles})
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
