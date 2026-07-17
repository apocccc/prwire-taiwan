import { defineRouting } from "next-intl/routing";
import { siteConfig } from "../../config/site";

export const routing = defineRouting({
  locales: siteConfig.locales,
  defaultLocale: siteConfig.defaultLocale,
  // SEO要件: 全公開URLを /{locale}/... に統一（zh がデフォルト）
  localePrefix: "always",
});
