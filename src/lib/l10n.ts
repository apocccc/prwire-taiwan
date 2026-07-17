import type { Locale } from "../../config/site";

/** ロケールに応じて zh/en フィールドを選択（存在しない場合はもう一方へフォールバック） */
export function pick(
  locale: Locale,
  zh: string | null | undefined,
  en: string | null | undefined
): string {
  if (locale === "zh") return zh ?? en ?? "";
  return en ?? zh ?? "";
}
