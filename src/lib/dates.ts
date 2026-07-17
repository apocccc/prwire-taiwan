import { siteConfig, type Locale } from "../../config/site";

/** Asia/Taipei 基準で公開日時を表示する */
export function formatTaipei(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-TW" : "en-US", {
    timeZone: siteConfig.timezone,
    year: "numeric",
    month: locale === "zh" ? "long" : "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatTaipeiDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-TW" : "en-US", {
    timeZone: siteConfig.timezone,
    year: "numeric",
    month: locale === "zh" ? "long" : "short",
    day: "numeric",
  }).format(date);
}
