"use client";

import { useLocale, useTranslations } from "next-intl";

/**
 * 利用規約同意チェック（事業者・メディア共通、全項目必須）
 * 1. 事例利用の許諾（APOC Co., Ltd.）
 * 2. メディア一覧公開への同意
 * 3. ダイレクト送付機能（将来実装）への同意
 * 4. 利用規約への同意（別タブでページ閲覧可）
 * 5. プライバシーポリシーへの同意（別タブでページ閲覧可）
 */
export function ConsentCheckboxes() {
  const t = useTranslations("auth");
  const locale = useLocale();

  const items = [
    { name: "consentCaseStudy", label: t("consentCaseStudy") },
    { name: "consentMediaListing", label: t("consentMediaListing") },
    { name: "consentDirectSend", label: t("consentDirectSend") },
  ];

  return (
    <fieldset className="rounded border border-gray-300 p-4">
      <legend className="px-1 text-sm font-semibold">{t("consentTitle")}</legend>

      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <a
          href={`/${locale}/terms`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 hover:underline"
        >
          {t("viewTerms")} ↗
        </a>
        <a
          href={`/${locale}/privacy`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 hover:underline"
        >
          {t("viewPrivacy")} ↗
        </a>
      </div>

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

        {/* 利用規約への同意（リンクは別タブ） */}
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consentTerms" required className="mt-1 shrink-0" />
          <span>
            {t("consentTerms")}{" "}
            <a
              href={`/${locale}/terms`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:underline"
            >
              {t("viewTerms")} ↗
            </a>
          </span>
        </label>

        {/* プライバシーポリシーへの同意（リンクは別タブ） */}
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consentPrivacy" required className="mt-1 shrink-0" />
          <span>
            {t("consentPrivacy")}{" "}
            <a
              href={`/${locale}/privacy`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:underline"
            >
              {t("viewPrivacy")} ↗
            </a>
          </span>
        </label>
      </div>
    </fieldset>
  );
}
