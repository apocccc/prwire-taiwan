"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "./RichTextEditor";

/* eslint-disable @next/next/no-img-element */

export interface EditorRelease {
  id: string;
  slug: string;
  status: string;
  titleZh: string | null;
  subtitleZh: string | null;
  bodyZh: JSONContent | null;
  titleEn: string | null;
  subtitleEn: string | null;
  bodyEn: JSONContent | null;
  metaDescriptionZh: string | null;
  metaDescriptionEn: string | null;
  thumbnailUrl: string | null;
  thumbnailCaption: string | null;
  reviewNote: string | null;
  categoryIds: string[];
  mediaOnlyInfo: string;
  mediaKitFiles: { id: string; fileName: string; fileSize: number }[];
}

export interface CategoryOption {
  id: string;
  label: string;
}

type Lang = "zh" | "en";

function isEmptyDoc(doc: JSONContent | null): boolean {
  if (!doc) return true;
  let hasContent = false;
  function walk(node: JSONContent) {
    if (hasContent) return;
    if (node.text?.trim()) hasContent = true;
    if (node.type === "captionedImage") hasContent = true;
    for (const child of node.content ?? []) walk(child);
  }
  walk(doc);
  return !hasContent;
}

export function ReleaseEditor({
  initial,
  categories,
}: {
  initial: EditorRelease;
  categories: CategoryOption[];
}) {
  const t = useTranslations("editor");
  const tDash = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();

  const [lang, setLang] = useState<Lang>("zh");
  const [status, setStatus] = useState(initial.status);
  const [slug, setSlug] = useState(initial.slug);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [kitFiles, setKitFiles] = useState(initial.mediaKitFiles);
  const [uploadingKit, setUploadingKit] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // フォーム状態（保存時にまとめて送信）
  const [form, setForm] = useState({
    titleZh: initial.titleZh ?? "",
    subtitleZh: initial.subtitleZh ?? "",
    titleEn: initial.titleEn ?? "",
    subtitleEn: initial.subtitleEn ?? "",
    metaDescriptionZh: initial.metaDescriptionZh ?? "",
    metaDescriptionEn: initial.metaDescriptionEn ?? "",
    thumbnailUrl: initial.thumbnailUrl ?? "",
    thumbnailCaption: initial.thumbnailCaption ?? "",
    customSlug: "",
    categoryIds: initial.categoryIds,
    mediaOnlyInfo: initial.mediaOnlyInfo,
  });
  const bodyZhRef = useRef<JSONContent | null>(initial.bodyZh);
  const bodyEnRef = useRef<JSONContent | null>(initial.bodyEn);

  const editable = !["IN_REVIEW"].includes(status);

  const set = useCallback(
    <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
      setForm((f) => ({ ...f, [key]: value }));
    },
    []
  );

  const errorLabels = useMemo(
    () =>
      ({
        errNoLanguage: t("errNoLanguage"),
        errThumbnail: t("errThumbnail"),
        errImageCaptions: t("errImageCaptions"),
        errTooManyImages: t("errTooManyImages"),
      }) as Record<string, string>,
    [t]
  );

  async function save(): Promise<boolean> {
    setSaving(true);
    setMessage(null);
    setErrors([]);
    const payload = {
      titleZh: form.titleZh || null,
      subtitleZh: form.subtitleZh || null,
      bodyZh: isEmptyDoc(bodyZhRef.current) ? null : bodyZhRef.current,
      titleEn: form.titleEn || null,
      subtitleEn: form.subtitleEn || null,
      bodyEn: isEmptyDoc(bodyEnRef.current) ? null : bodyEnRef.current,
      metaDescriptionZh: form.metaDescriptionZh || null,
      metaDescriptionEn: form.metaDescriptionEn || null,
      thumbnailUrl: form.thumbnailUrl || null,
      thumbnailCaption: form.thumbnailCaption || null,
      ...(form.customSlug ? { customSlug: form.customSlug } : {}),
      categoryIds: form.categoryIds,
      mediaOnlyInfo: form.mediaOnlyInfo || null,
    };
    const res = await fetch(`/api/releases/${initial.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const code = body?.error as string | undefined;
      setErrors([code && errorLabels[code] ? errorLabels[code] : t("validationError")]);
      return false;
    }
    const body = await res.json();
    if (body.slug) setSlug(body.slug);
    setMessage(t("saved"));
    return true;
  }

  async function submitForReview(scheduledAtLocal: string) {
    if (!window.confirm(t("submitConfirm"))) return;
    setSubmitting(true);
    setErrors([]);
    setMessage(null);

    const saved = await save();
    if (!saved) {
      setSubmitting(false);
      return;
    }

    const scheduledAt = scheduledAtLocal
      ? new Date(scheduledAtLocal).toISOString()
      : null;
    const res = await fetch(`/api/releases/${initial.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      if (body?.codes) {
        setErrors((body.codes as string[]).map((c) => errorLabels[c] ?? c));
      } else {
        setErrors([t("validationError")]);
      }
      return;
    }
    const body = await res.json();
    setStatus(body.status);
    setMessage(body.status === "PUBLISHED" ? t("publishedNow") : t("submitted"));
    router.refresh();
  }

  async function uploadThumbnail(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads/image", { method: "POST", body: fd });
    if (!res.ok) {
      alert("Upload failed");
      return;
    }
    const { url } = await res.json();
    set("thumbnailUrl", url);
  }

  async function uploadKitFile(file: File) {
    setUploadingKit(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/releases/${initial.id}/media-kit`, {
      method: "POST",
      body: fd,
    });
    setUploadingKit(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      alert(`Upload failed (${body?.error ?? res.status})`);
      return;
    }
    const { file: record } = await res.json();
    setKitFiles((fs) => [...fs, record]);
  }

  async function deleteKitFile(fileId: string) {
    const res = await fetch(`/api/media-kit/${fileId}`, { method: "DELETE" });
    if (res.ok) setKitFiles((fs) => fs.filter((f) => f.id !== fileId));
  }

  const [scheduledAtLocal, setScheduledAtLocal] = useState("");

  const inputCls = "mt-1 w-full rounded border border-gray-300 px-3 py-2";
  const labelCls = "block text-sm font-medium";

  return (
    <div className="space-y-8">
      {/* ステータス・メッセージ */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
          {tDash(`status.${status}` as Parameters<typeof tDash>[0])}
        </span>
        <a
          href={`/${locale}/dashboard/releases/${initial.id}/preview`}
          target="_blank"
          className="text-sm text-blue-700 hover:underline"
        >
          {tDash("preview")} ↗
        </a>
        {message && <span className="text-sm text-green-700">{message}</span>}
      </div>

      {initial.reviewNote && status === "DRAFT" && (
        <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
          <strong>{tDash("reviewNote")}:</strong> {initial.reviewNote}
        </div>
      )}

      {errors.length > 0 && (
        <div role="alert" className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">{t("validationError")}</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 言語タブ */}
      <div>
        <div className="flex border-b border-gray-300">
          {(["zh", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`px-4 py-2 text-sm font-medium ${
                lang === l
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {l === "zh" ? t("langZh") : t("langEn")}
            </button>
          ))}
        </div>

        <div className={lang === "zh" ? "mt-4 space-y-4" : "hidden"}>
          <div>
            <label className={labelCls}>{t("title")}</label>
            <input type="text" value={form.titleZh} maxLength={200} disabled={!editable}
              onChange={(e) => set("titleZh", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t("subtitle")}</label>
            <input type="text" value={form.subtitleZh} maxLength={300} disabled={!editable}
              onChange={(e) => set("subtitleZh", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t("body")}</label>
            <div className="mt-1">
              <RichTextEditor
                initialContent={initial.bodyZh}
                onChange={(json) => (bodyZhRef.current = json)}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>{t("metaDescription")}</label>
            <textarea value={form.metaDescriptionZh} maxLength={300} rows={2} disabled={!editable}
              onChange={(e) => set("metaDescriptionZh", e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className={lang === "en" ? "mt-4 space-y-4" : "hidden"}>
          <div>
            <label className={labelCls}>{t("title")}</label>
            <input type="text" value={form.titleEn} maxLength={200} disabled={!editable}
              onChange={(e) => set("titleEn", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t("subtitle")}</label>
            <input type="text" value={form.subtitleEn} maxLength={300} disabled={!editable}
              onChange={(e) => set("subtitleEn", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t("body")}</label>
            <div className="mt-1">
              <RichTextEditor
                initialContent={initial.bodyEn}
                onChange={(json) => (bodyEnRef.current = json)}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>{t("metaDescription")}</label>
            <textarea value={form.metaDescriptionEn} maxLength={300} rows={2} disabled={!editable}
              onChange={(e) => set("metaDescriptionEn", e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* サムネイル */}
      <section className="rounded border border-gray-200 p-4">
        <h2 className="font-semibold">{t("thumbnail")}</h2>
        <div className="mt-3 flex flex-wrap items-start gap-4">
          {form.thumbnailUrl ? (
            <img src={form.thumbnailUrl} alt="" className="h-32 w-56 rounded bg-gray-100 object-contain" />
          ) : (
            <div className="flex h-32 w-56 items-center justify-center rounded bg-gray-100 text-sm text-gray-400">
              16:9
            </div>
          )}
          <div className="flex-1 space-y-2">
            <button
              type="button"
              disabled={!editable}
              onClick={() => thumbInputRef.current?.click()}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              {t("uploadImage")}
            </button>
            <div>
              <label className={labelCls}>{t("thumbnailCaption")}</label>
              <input
                type="text"
                value={form.thumbnailCaption}
                maxLength={300}
                disabled={!editable}
                onChange={(e) => set("thumbnailCaption", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>
        <input
          ref={thumbInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadThumbnail(file);
            e.target.value = "";
          }}
        />
      </section>

      {/* スラッグ */}
      <section className="rounded border border-gray-200 p-4">
        <label className={labelCls}>{t("slugLabel")}</label>
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span className="text-gray-500">/news/</span>
          <input
            type="text"
            value={form.customSlug}
            placeholder={slug}
            pattern="[a-zA-Z0-9-]*"
            maxLength={60}
            disabled={!editable || ["PUBLISHED", "UNPUBLISHED"].includes(status)}
            onChange={(e) => set("customSlug", e.target.value)}
            className="w-64 rounded border border-gray-300 px-3 py-1.5"
          />
        </div>
      </section>

      {/* 配信前設定 */}
      <section className="rounded border border-gray-200 p-4 space-y-5">
        <h2 className="font-semibold">{t("settingsStep")}</h2>

        <div>
          <p className={labelCls}>{t("categories")}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={form.categoryIds.includes(c.id)}
                  disabled={!editable}
                  onChange={(e) =>
                    set(
                      "categoryIds",
                      e.target.checked
                        ? [...form.categoryIds, c.id]
                        : form.categoryIds.filter((id) => id !== c.id)
                    )
                  }
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>{t("mediaOnlyInfo")}</label>
          <textarea
            value={form.mediaOnlyInfo}
            rows={4}
            maxLength={10000}
            disabled={!editable}
            onChange={(e) => set("mediaOnlyInfo", e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <p className={labelCls}>{t("mediaKit")}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {kitFiles.map((f) => (
              <li key={f.id} className="flex items-center gap-2">
                <span>
                  {f.fileName}{" "}
                  <span className="text-gray-400">
                    ({(f.fileSize / 1024 / 1024).toFixed(1)}MB)
                  </span>
                </span>
                {editable && (
                  <button
                    type="button"
                    onClick={() => deleteKitFile(f.id)}
                    className="text-red-600 hover:underline"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
          <label className="mt-2 inline-block">
            <span className="cursor-pointer rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
              {uploadingKit ? "..." : t("uploadFile")}
            </span>
            <input
              type="file"
              accept=".zip,.pdf,image/jpeg,image/png,image/webp,image/gif,application/zip,application/pdf"
              className="hidden"
              disabled={!editable || uploadingKit}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadKitFile(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </section>

      {/* アクション */}
      <section className="sticky bottom-0 border-t border-gray-200 bg-white py-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || !editable}
            className="rounded border border-gray-400 px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? "..." : t("saveDraft")}
          </button>
          {["DRAFT", "UNPUBLISHED"].includes(status) && (
            <>
              <label className="text-sm text-gray-600">
                {t("scheduledAt")}
                <input
                  type="datetime-local"
                  value={scheduledAtLocal}
                  onChange={(e) => setScheduledAtLocal(e.target.value)}
                  className="ml-2 rounded border border-gray-300 px-2 py-1.5"
                />
              </label>
              <button
                type="button"
                onClick={() => submitForReview(scheduledAtLocal)}
                disabled={submitting}
                className="rounded bg-gray-900 px-5 py-2 font-medium text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {submitting ? "..." : t("submitForReview")}
              </button>
            </>
          )}
          <a href={`/${locale}/dashboard`} className="ml-auto text-sm text-gray-500 hover:underline">
            ← {t("backToDashboard")}
          </a>
        </div>
      </section>
    </div>
  );
}
