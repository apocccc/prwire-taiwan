import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { createCategory, deleteCategory, updateCategory } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

/** カテゴリマスタ管理（zh-Hant / en 両方の名称 + slug） */
export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ["ADMIN"]);
  const t = await getTranslations("adminPanel");
  const tCommon = await getTranslations("common");

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { releases: true } } },
  });

  const input = "rounded border border-gray-300 px-2 py-1.5 text-sm";

  return (
    <section>
      <h2 className="text-lg font-semibold">{t("categoriesAdmin")}</h2>

      <div className="mt-4 space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-2">
            <form
              action={updateCategory.bind(null, c.id)}
              className="flex flex-wrap items-center gap-2"
            >
              <input name="slug" defaultValue={c.slug} required
                pattern="[a-z0-9](?:[a-z0-9-]*[a-z0-9])?" className={`${input} w-40`}
                aria-label={t("categorySlug")} />
              <input name="nameZh" defaultValue={c.nameZh} required className={`${input} w-40`}
                aria-label={t("categoryName_zh")} />
              <input name="nameEn" defaultValue={c.nameEn} required className={`${input} w-40`}
                aria-label={t("categoryName_en")} />
              <button className="rounded border border-gray-400 px-3 py-1.5 text-sm hover:bg-gray-50">
                {tCommon("save")}
              </button>
            </form>
            <span className="text-xs text-gray-400">({c._count.releases})</span>
            <form action={deleteCategory.bind(null, c.id)}>
              <button className="px-2 text-sm text-red-600 hover:underline">
                {tCommon("delete")}
              </button>
            </form>
          </div>
        ))}
      </div>

      <form action={createCategory} className="mt-6 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4">
        <input name="slug" placeholder={t("categorySlug")} required
          pattern="[a-z0-9](?:[a-z0-9-]*[a-z0-9])?" className={`${input} w-40`} />
        <input name="nameZh" placeholder={t("categoryName_zh")} required className={`${input} w-40`} />
        <input name="nameEn" placeholder={t("categoryName_en")} required className={`${input} w-40`} />
        <button className="rounded bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700">
          + {t("addCategory")}
        </button>
      </form>
    </section>
  );
}
