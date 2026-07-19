/** 配信目的の選択肢（キーは i18n editor.purposeOptions.* と対応） */
export const PURPOSES = [
  "PRODUCT", // 商品・サービス
  "EVENT", // イベント・セミナー
  "CAMPAIGN", // キャンペーン・セール
  "CORPORATE", // 経営・会社情報
  "RESEARCH", // 調査・レポート
  "PEOPLE", // 人物・人事
  "AWARD", // 受賞・認定
  "PARTNERSHIP", // 業務提携・協業
  "FINANCE", // 資金調達・IR
  "TECH", // 技術・研究開発
  "CSR", // CSR・サステナビリティ
  "OTHER", // その他
] as const;

export type Purpose = (typeof PURPOSES)[number];

export function isPurpose(v: unknown): v is Purpose {
  return typeof v === "string" && (PURPOSES as readonly string[]).includes(v);
}
