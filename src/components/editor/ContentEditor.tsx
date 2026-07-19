"use client";

import { useRef, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "./RichTextEditor";
import { PreviewModal } from "./PreviewModal";
import { PURPOSES } from "@/lib/purposes";
import { tiptapToPlainText, collectBodyImages } from "@/lib/tiptap-render";

export interface ContentInitial {
  id: string;
  slug: string;
  status: string;
  titleZh: string | null;
  subtitleZh: string | null;
  bodyZh: JSONContent | null;
  metaDescriptionZh: string | null;
  purpose: string | null;
}

function isEmptyDoc(doc: JSONContent | null): boolean {
  if (!doc) return true;
  let has = false;
  function walk(n: JSONContent) {
    if (has) return;
    if (n.text?.trim()) has = true;
    if (n.type === "captionedImage") has = true;
    for (const c of n.content ?? []) walk(c);
  }
  walk(doc);
  return !has;
}

function statsOf(doc: JSONContent | null) {
  return {
    chars: tiptapToPlainText(doc).length,
    images: collectBodyImages(doc).length,
  };
}

/** ステップ1: 本文エディター（PR TIMES風の左サイドバー + 本文） */
export function ContentEditor({ initial }: { initial: ContentInitial }) {
  const t = useTranslations("editor");
  const tDash = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();

  const [title, setTitle] = useState(initial.titleZh ?? "");
  const [subtitle, setSubtitle] = useState(initial.subtitleZh ?? "");
  const [purpose, setPurpose] = useState(initial.purpose ?? "");
  const bodyRef = useRef<JSONContent | null>(initial.bodyZh);
  const [stats, setStats] = useState(statsOf(initial.bodyZh));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const editable = initial.status !== "IN_REVIEW";

  async function save(): Promise<boolean> {
    setSaving(true);
    setMessage(null);
    setErrorMsg(null);
    const res = await fetch(`/api/releases/${initial.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titleZh: title || null,
        subtitleZh: subtitle || null,
        bodyZh: isEmptyDoc(bodyRef.current) ? null : bodyRef.current,
        purpose: purpose || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      setErrorMsg(
        b?.error && ["errImageCaptions", "errTooManyImages"].includes(b.error)
          ? t(b.error as "errImageCaptions")
          : t("validationError")
      );
      return false;
    }
    setMessage(t("saved"));
    return true;
  }

  async function openPreview() {
    if (await save()) setPreviewOpen(true);
  }
  async function goNext() {
    if (await save())
      router.push(`/${locale}/dashboard/releases/${initial.id}/settings`);
  }

  const previewUrl = `/${locale}/dashboard/releases/${initial.id}/preview`;

  return (
    <div className="min-h-screen">
      {/* トップバー */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <a
            href={`/${locale}/dashboard`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-50"
            aria-label={t("backToDashboard")}
          >
            ‹
          </a>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
            {tDash(`status.${initial.status}` as Parameters<typeof tDash>[0])}
          </span>
          {message && <span className="text-sm text-green-700">{message}</span>}
          {errorMsg && <span className="text-sm text-red-600">{errorMsg}</span>}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/${locale}/terms`}
            target="_blank"
            className="px-2 text-sm text-gray-500 hover:underline"
          >
            {t("faq")}
          </a>
          <button
            type="button"
            onClick={openPreview}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            {tDash("preview")}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !editable}
            className="rounded bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? "..." : t("saveDraft")}
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={saving || !editable}
            className="rounded bg-[#d51f1a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#b3160f] disabled:opacity-50"
          >
            {t("next")} ›
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* 左サイドバー */}
        <aside className="shrink-0 border-b border-gray-200 p-6 md:w-64 md:border-b-0 md:border-r">
          <div className="space-y-6 text-sm">
            <div>
              <p className="text-gray-500">{t("charCount")}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{stats.chars}</p>
            </div>
            <div>
              <p className="text-gray-500">{t("imageCount")}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {stats.images} / 10
              </p>
            </div>
            <div>
              <p className="text-gray-500">{t("purpose")}</p>
              <select
                value={purpose}
                disabled={!editable}
                onChange={(e) => setPurpose(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-2 py-2"
              >
                <option value="">{t("purposePlaceholder")}</option>
                {PURPOSES.map((p) => (
                  <option key={p} value={p}>
                    {t(`purposeOptions.${p}` as "purposeOptions.PRODUCT")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* 本文 */}
        <div className="min-w-0 flex-1 px-4 py-6 md:px-10">
          <input
            type="text"
            value={title}
            disabled={!editable}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("titlePlaceholder")}
            className="w-full border-none text-3xl font-bold placeholder:text-gray-300 focus:outline-none"
          />
          <input
            type="text"
            value={subtitle}
            disabled={!editable}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder={t("subtitlePlaceholder")}
            className="mt-4 w-full border-none text-lg text-gray-700 placeholder:text-gray-300 focus:outline-none"
          />
          <div className="mt-6">
            <RichTextEditor
              initialContent={initial.bodyZh}
              onChange={(json) => {
                bodyRef.current = json;
                setStats(statsOf(json));
              }}
            />
          </div>
        </div>
      </div>

      {previewOpen && (
        <PreviewModal url={previewUrl} onClose={() => setPreviewOpen(false)} />
      )}
    </div>
  );
}
