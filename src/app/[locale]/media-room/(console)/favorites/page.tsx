import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { formatTaipeiDate } from "@/lib/dates";
import { articlePath } from "@/lib/article-url";
import { pick } from "@/lib/l10n";
import { removeFavorite } from "../manage-actions";
import type { Locale } from "../../../../../../config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireRole(locale, ["MEDIA", "ADMIN"]);
  const t = await getTranslations("mediaRoom");
  const l = locale as Locale;

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      release: {
        select: {
          id: true,
          seq: true,
          titleZh: true,
          titleEn: true,
          publishedAt: true,
          company: { select: { seq: true, nameZh: true, nameEn: true } },
        },
      },
    },
  });

  return (
    <section>
      <h2 className="text-lg font-semibold">{t("favorites")}</h2>
      {favorites.length === 0 ? (
        <p className="mt-4 text-gray-600">{t("favoritesEmpty")}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {favorites.map(({ release: r }) => (
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
                  <td className="whitespace-nowrap py-3 text-right">
                    <form action={removeFavorite.bind(null, r.id)}>
                      <button
                        type="submit"
                        className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:border-[#d51f1a] hover:text-[#d51f1a]"
                      >
                        {t("remove")}
                      </button>
                    </form>
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
