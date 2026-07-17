"use client";

import { useLocale, useTranslations } from "next-intl";

/**
 * 登録時の同意チェック（事業者・メディア共通、必須）。
 * 利用規約・プライバシーポリシーの2項目のみ（案例利用・メディア一覧公開・
 * ダイレクト送付の各同意は利用規約本文に包含される）。
 * リンクは別タブで内容を閲覧できる。
 */
export function ConsentCheckboxes() {
  const t = useTranslations("auth");
  const locale = useLocale();

  return (
    <fieldset className="rounded border border-gray-300 p-4">
      <legend className="px-1 text-sm font-semibold">{t("consentTitle")}</legend>

      <div className="space-y-3">
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
