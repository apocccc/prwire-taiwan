import { defineRouting } from "next-intl/routing";
import { siteConfig } from "../../config/site";

export const routing = defineRouting({
  locales: siteConfig.locales,
  defaultLocale: siteConfig.defaultLocale,
  // SEO要件: 全公開URLを /{locale}/... に統一（zh がデフォルト）
  localePrefix: "always",
  // ブラウザ言語での自動判定を無効化し、`/` は常に繁体字（zh）へ着地させる。
  // 英語表示は言語切替（ヘッダー右上）で /en に切り替える運用。
  localeDetection: false,
});
