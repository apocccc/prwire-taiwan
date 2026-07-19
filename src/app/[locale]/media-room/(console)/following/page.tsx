import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { formatTaipeiDate } from "@/lib/dates";
import { articlePath } from "@/lib/article-url";
import { pick } from "@/lib/l10n";
import { unfollowCompany } from "../manage-actions";
import type { Locale } from "../../../../../../config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

export default async function FollowingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireRole(locale, ["MEDIA", "ADMIN"]);
  const t = await getTranslations("mediaRoom");
  const l = locale as Locale;

  const follows = await prisma.companyFollow.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      company: {
        select: {
          id: true,
          slug: true,
          nameZh: true,
          nameEn: true,
          releases: {
            where: {
              status: { in: ["PUBLISHED", "SCHEDULED"] },
              publishedAt: { lte: new Date() },
            },
            orderBy: { publishedAt: "desc" },
            take: 1,
            select: {
              seq: true,
              titleZh: true,
              titleEn: true,
              publishedAt: true,
              company: { select: { seq: true } },
            },
          },
        },
      },
    },
  });

  return (
    <section>
      <h2 className="text-lg font-semibold">{t("followingCompanies")}</h2>
      {follows.length === 0 ? (
        <p className="mt-4 text-gray-600">{t("followingEmpty")}</p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-200">
          {follows.map(({ company: c }) => {
            const latest = c.releases[0];
            return (
              <li key={c.id} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <Link
                    href={`/company/${c.slug}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {pick(l, c.nameZh, c.nameEn)}
                  </Link>
                  {latest ? (
                    <Link
                      href={articlePath(latest)}
                      className="mt-1 block truncate text-xs text-gray-500 hover:underline"
                    >
                      {t("latestLabel")}: {latest.titleZh || latest.titleEn}
                      {latest.publishedAt && ` (${formatTaipeiDate(latest.publishedAt, l)})`}
                    </Link>
                  ) : (
                    <span className="mt-1 block text-xs text-gray-400">
                      {t("noReleasesYet")}
                    </span>
                  )}
                </div>
                <form action={unfollowCompany.bind(null, c.id)}>
                  <button
                    type="submit"
                    className="whitespace-nowrap rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:border-[#d51f1a] hover:text-[#d51f1a]"
                  >
                    {t("unfollow")}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
