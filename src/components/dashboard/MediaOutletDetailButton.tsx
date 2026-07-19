"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export interface MediaOutletDetail {
  outletName: string;
  contactName: string;
  contactTitle: string | null;
  contactEmail: string;
  contactPhone: string | null;
  outletUrl: string;
}

/** 開示したメディアの詳細をポップアップ表示。各項目にコピーボタン付き。 */
export function MediaOutletDetailButton({ outlet }: { outlet: MediaOutletDetail }) {
  const t = useTranslations("mediaDetail");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      /* クリップボード不可の環境では無視 */
    }
  }

  const rows: { key: string; label: string; value: string | null }[] = [
    { key: "outletName", label: t("outletName"), value: outlet.outletName },
    { key: "contactName", label: t("contactName"), value: outlet.contactName },
    { key: "contactTitle", label: t("contactTitle"), value: outlet.contactTitle },
    { key: "contactEmail", label: t("contactEmail"), value: outlet.contactEmail },
    { key: "contactPhone", label: t("contactPhone"), value: outlet.contactPhone },
    { key: "outletUrl", label: t("outletUrl"), value: outlet.outletUrl },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="whitespace-nowrap rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:border-[#d51f1a] hover:text-[#d51f1a]"
      >
        {t("viewDetail")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold">{t("title")}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label={t("close")}
              >
                ✕
              </button>
            </div>

            <dl className="mt-4 divide-y divide-gray-100">
              {rows.map((r) => (
                <div key={r.key} className="flex items-center gap-3 py-2.5">
                  <dt className="w-28 shrink-0 text-sm text-gray-500">{r.label}</dt>
                  <dd className="min-w-0 flex-1 break-words text-sm text-gray-900">
                    {r.value ? r.value : <span className="text-gray-400">—</span>}
                  </dd>
                  {r.value && (
                    <button
                      type="button"
                      onClick={() => copy(r.key, r.value!)}
                      className="shrink-0 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      {copied === r.key ? t("copied") : t("copy")}
                    </button>
                  )}
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </>
  );
}
