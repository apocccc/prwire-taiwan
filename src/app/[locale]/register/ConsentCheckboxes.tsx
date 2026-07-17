"use client";

import { useTranslations } from "next-intl";

/**
 * 利用規約同意チェック（事業者・メディア共通、全項目必須）
 * 1. 事例利用の許諾（APOC Wire / 株式会社APOC）
 * 2. メディア一覧公開への同意
 * 3. ダイレクト送付機能（将来実装）への同意
 * 4. 利用規約全体への同意
 */
export function ConsentCheckboxes() {
  const t = useTranslations("auth");

  const items = [
    { name: "consentCaseStudy", label: t("consentCaseStudy") },
    { name: "consentMediaListing", label: t("consentMediaListing") },
    { name: "consentDirectSend", label: t("consentDirectSend") },
    { name: "consentTerms", label: t("consentTerms") },
  ];

  return (
    <fieldset className="rounded border border-gray-300 p-4">
      <legend className="px-1 text-sm font-semibold">{t("consentTitle")}</legend>
      <div className="space-y-3">
        {items.map((item) => (
          <label key={item.name} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name={item.name}
              required
              className="mt-1 shrink-0"
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
