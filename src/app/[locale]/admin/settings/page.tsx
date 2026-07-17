import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { updateSettings } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

/** サイト設定（審査フローON/OFF、サービス名・フッター文言の上書き） */
export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ["ADMIN"]);
  const t = await getTranslations("adminPanel");
  const tCommon = await getTranslations("common");

  const settings = await prisma.siteSetting.findUnique({ where: { id: 1 } });

  const input = "mt-1 w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm";
  const label = "block text-sm font-medium";

  return (
    <section>
      <h2 className="text-lg font-semibold">{t("settings")}</h2>
      <form action={updateSettings} className="mt-4 space-y-5">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="reviewRequired"
            defaultChecked={settings?.reviewRequired ?? true}
          />
          {t("reviewRequired")}
        </label>

        <div>
          <label className={label}>{t("serviceNameOverride")} (zh)</label>
          <input name="serviceNameZh" defaultValue={settings?.serviceNameZh ?? ""} className={input} />
        </div>
        <div>
          <label className={label}>{t("serviceNameOverride")} (en)</label>
          <input name="serviceNameEn" defaultValue={settings?.serviceNameEn ?? ""} className={input} />
        </div>
        <div>
          <label className={label}>{t("footerText")} (zh)</label>
          <textarea name="footerTextZh" rows={2} defaultValue={settings?.footerTextZh ?? ""} className={input} />
        </div>
        <div>
          <label className={label}>{t("footerText")} (en)</label>
          <textarea name="footerTextEn" rows={2} defaultValue={settings?.footerTextEn ?? ""} className={input} />
        </div>

        <button className="rounded bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700">
          {tCommon("save")}
        </button>
      </form>
    </section>
  );
}
