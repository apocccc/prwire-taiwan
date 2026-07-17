/**
 * サイト設定の一元管理
 *
 * サービス名は未定のため仮称 `twpr` を使用。
 * 正式名称・ドメイン・ロゴが決まったらこのファイルを書き換えるだけで
 * 全ページ（メタタグ、JSON-LD、フッター等）に反映される。
 */
export const siteConfig = {
  /** コード上の仮称（内部識別子） */
  codeName: "twpr",

  /** サービス表示名（ロケール別） */
  name: {
    zh: "twpr 新聞稿發布平台",
    en: "twpr Press Release Wire",
  },

  /** サービスの説明（メタ description のデフォルト） */
  description: {
    zh: "任何人都能免費發布新聞稿的台灣在地新聞稿發布平台。",
    en: "A free press release distribution platform for Taiwan.",
  },

  /** 本番ドメイン（末尾スラッシュなし） */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://twpr.example.com",

  /** ロゴ・OGP画像のパス（public/ 配下） */
  logoPath: "/logo.svg",
  ogImagePath: "/og-default.png",

  /** ロケール設定（繁体字がデフォルト） */
  defaultLocale: "zh" as const,
  locales: ["zh", "en"] as const,

  /** HTML lang / hreflang 用のマッピング */
  htmlLang: { zh: "zh-Hant", en: "en" } as Record<string, string>,
  hreflang: { zh: "zh-Hant", en: "en" } as Record<string, string>,
  ogLocale: { zh: "zh_TW", en: "en_US" } as Record<string, string>,

  /** 公開日時の表示タイムゾーン */
  timezone: "Asia/Taipei",

  /** 運営者情報（利用規約・JSON-LD publisher 用） */
  operator: {
    companyName: "株式会社APOC",
    serviceBrand: "APOC Wire",
  },
} as const;

export type Locale = (typeof siteConfig.locales)[number];
