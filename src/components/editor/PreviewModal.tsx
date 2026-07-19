"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * プレビューをポップアップ（モーダル）で表示。
 * PC・モバイルのモック枠の中に、実際のプレビューページを iframe で表示する。
 */
export function PreviewModal({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  const t = useTranslations("editor");
  const tDash = useTranslations("dashboard");
  const [device, setDevice] = useState<"pc" | "mobile">("pc");

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/60"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex gap-1 rounded-full bg-white/10 p-1">
          <button
            type="button"
            onClick={() => setDevice("pc")}
            className={`rounded-full px-4 py-1 text-sm font-medium ${
              device === "pc" ? "bg-white text-gray-900" : "text-white"
            }`}
          >
            {t("previewPc")}
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={`rounded-full px-4 py-1 text-sm font-medium ${
              device === "mobile" ? "bg-white text-gray-900" : "text-white"
            }`}
          >
            {t("previewMobile")}
          </button>
        </div>
        <span className="text-sm font-medium text-white">{tDash("preview")}</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/20"
        >
          {t("close")} ✕
        </button>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-auto p-6">
        {device === "pc" ? (
          <div className="w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-100 px-4 py-2.5">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <iframe src={url} title="preview-pc" className="h-[72vh] w-full bg-white" />
          </div>
        ) : (
          <div className="w-[390px] max-w-full overflow-hidden rounded-[2.2rem] border-[10px] border-gray-900 bg-white shadow-2xl">
            <div className="flex justify-center bg-gray-900 py-1.5">
              <span className="h-1.5 w-16 rounded-full bg-gray-700" />
            </div>
            <iframe src={url} title="preview-mobile" className="h-[70vh] w-full bg-white" />
          </div>
        )}
      </div>
    </div>
  );
}
