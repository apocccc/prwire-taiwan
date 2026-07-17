import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { siteConfig, type Locale } from "../../config/site";

/**
 * DB上のサイト設定（管理画面から変更可能）を取得し、config/site.ts の既定値とマージする。
 * DB未接続時（ビルド環境など）は既定値にフォールバック。
 */
export const getSiteSettings = cache(async () => {
  try {
    const s = await prisma.siteSetting.findUnique({ where: { id: 1 } });
    return {
      reviewRequired: s?.reviewRequired ?? true,
      name: {
        zh: s?.serviceNameZh || siteConfig.name.zh,
        en: s?.serviceNameEn || siteConfig.name.en,
      } as Record<Locale, string>,
      footerText: {
        zh: s?.footerTextZh || null,
        en: s?.footerTextEn || null,
      } as Record<Locale, string | null>,
      logoUrl: s?.logoUrl || siteConfig.logoPath,
    };
  } catch {
    return {
      reviewRequired: true,
      name: siteConfig.name as Record<Locale, string>,
      footerText: { zh: null, en: null } as Record<Locale, string | null>,
      logoUrl: siteConfig.logoPath,
    };
  }
});
