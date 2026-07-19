"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

/* eslint-disable @next/next/no-img-element */

const PHONE_CC = "+886";

export interface SettingsInitial {
  id: string;
  status: string;
  thumbnailUrl: string | null;
  thumbnailCaption: string | null;
  categoryIds: string[];
  mediaOnlyInfo: string;
  pressContactDept: string | null;
  pressContactName: string | null;
  pressContactEmail: string | null;
  pressContactPhone: string | null;
  reviewNote: string | null;
  mediaKitFiles: { id: string; fileName: string; fileSize: number }[];
}

export interface CategoryOption {
  id: string;
  label: string;
}

export function SettingsStep({
  initial,
  categories,
}: {
  initial: SettingsInitial;
  categories: CategoryOption[];
}) {
  const t = useTranslations("editor");
  const tDash = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();

  const [status, setStatus] = useState(initial.status);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [kitFiles, setKitFiles] = useState(initial.mediaKitFiles);
  const [uploadingKit, setUploadingKit] = useState(false);
  const [scheduledAtLocal, setScheduledAtLocal] = useState("");
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    thumbnailUrl: initial.thumbnailUrl ?? "",
    thumbnailCaption: initial.thumbnailCaption ?? "",
    categoryIds: initial.categoryIds,
    mediaOnlyInfo: initial.mediaOnlyInfo,
    pressContactDept: initial.pressContactDept ?? "",
    pressContactName: initial.pressContactName ?? "",
    pressContactEmail: initial.pressContactEmail ?? "",
    pressContactPhone: (initial.pressContactPhone ?? "").replace(/^\+886\s*/, ""),
  });

  const editable = status !== "IN_REVIEW";

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const errorLabels: Record<string, string> = {
    errNoContent: t("errNoContent"),
    errThumbnail: t("errThumbnail"),
    errImageCaptions: t("errImageCaptions"),
    errTooManyImages: t("errTooManyImages"),
    errContact: t("errContact"),
  };

  async function save(): Promise<boolean> {
    setSaving(true);
    setMessage(null);
    setErrors([]);
    const phone = form.pressContactPhone.trim();
    const res = await fetch(`/api/releases/${initial.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thumbnailUrl: form.thumbnailUrl || null,
        thumbnailCaption: form.thumbnailCaption || null,
        categoryIds: form.categoryIds,
        mediaOnlyInfo: form.mediaOnlyInfo || null,
        pressContactDept: form.pressContactDept || null,
        pressContactName: form.pressContactName || null,
        pressContactEmail: form.pressContactEmail || null,
        pressContactPhone: phone ? `${PHONE_CC} ${phone}` : null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setErrors([t("validationError")]);
      return false;
    }
    setMessage(t("saved"));
    return true;
  }

  async function distribute() {
    if (!window.confirm(t("submitConfirm"))) return;
    setSubmitting(true);
    setErrors([]);
    setMessage(null);
    if (!(await save())) {
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
      const b = await res.json().catch(() => null);
      if (b?.codes) setErrors((b.codes as string[]).map((c) => errorLabels[c] ?? c));
      else setErrors([t("validationError")]);
      return;
    }
    const b = await res.json();
    setStatus(b.status);
    setMessage(b.status === "PUBLISHED" ? t("publishedNow") : t("submitted"));
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
      const b = await res.json().catch(() => null);
      alert(`Upload failed (${b?.error ?? res.status})`);
      return;
    }
    const { file: rec } = await res.json();
    setKitFiles((fs) => [...fs, rec]);
  }

  async function deleteKitFile(fileId: string) {
    const res = await fetch(`/api/media-kit/${fileId}`, { method: "DELETE" });
    if (res.ok) setKitFiles((fs) => fs.filter((f) => f.id !== fileId));
  }

  const inputCls = "mt-1 w-full rounded border border-gray-300 px-3 py-2";
  const labelCls = "block text-sm font-medium";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <a
            href={`/${locale}/dashboard/releases/${initial.id}`}
            className="text-sm text-gray-500 hover:underline"
          >
            ‹ {t("back")}
          </a>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
            {tDash(`status.${status}` as Parameters<typeof tDash>[0])}
          </span>
          {message && <span className="text-sm text-green-700">{message}</span>}
        </div>
      </div>

      <h1 className="mt-4 text-2xl font-bold">{t("step2")}</h1>

      {initial.reviewNote && status === "DRAFT" && (
        <div className="mt-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
          <strong>{tDash("reviewNote")}:</strong> {initial.reviewNote}
        </div>
      )}

      {errors.length > 0 && (
        <div role="alert" className="mt-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">{t("validationError")}</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* サムネイル */}
      <section className="mt-6 rounded border border-gray-200 p-4">
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
            <button type="button" disabled={!editable} onClick={() => thumbInputRef.current?.click()}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
              {t("uploadImage")}
            </button>
            <div>
              <label className={labelCls}>{t("thumbnailCaption")}</label>
              <input type="text" value={form.thumbnailCaption} disabled={!editable}
                onChange={(e) => set("thumbnailCaption", e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
        <input ref={thumbInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadThumbnail(f);
            e.target.value = "";
          }} />
      </section>

      {/* カテゴリ */}
      <section className="mt-6 rounded border border-gray-200 p-4">
        <p className={labelCls}>{t("categories")}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={form.categoryIds.includes(c.id)} disabled={!editable}
                onChange={(e) =>
                  set("categoryIds",
                    e.target.checked
                      ? [...form.categoryIds, c.id]
                      : form.categoryIds.filter((id) => id !== c.id))
                } />
              {c.label}
            </label>
          ))}
        </div>
      </section>

      {/* 連絡先（必須・メディア限定） */}
      <section className="mt-6 rounded border border-gray-200 p-4">
        <h2 className="font-semibold">
          {t("pressContactTitle")} <span className="text-red-600">*</span>
        </h2>
        <p className="mt-1 text-xs text-gray-500">{t("pressContactNote")}</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>{t("contactDept")}</label>
            <input type="text" value={form.pressContactDept} disabled={!editable}
              onChange={(e) => set("pressContactDept", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t("contactName")}</label>
            <input type="text" value={form.pressContactName} disabled={!editable}
              onChange={(e) => set("pressContactName", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t("contactEmail")}</label>
            <input type="email" value={form.pressContactEmail} disabled={!editable}
              onChange={(e) => set("pressContactEmail", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t("contactPhone")}</label>
            <div className="mt-1 flex items-center">
              <span className="rounded-l border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {PHONE_CC}
              </span>
              <input type="tel" value={form.pressContactPhone} disabled={!editable}
                placeholder="2 1234 5678"
                onChange={(e) => set("pressContactPhone", e.target.value)}
                className="w-full rounded-r border border-gray-300 px-3 py-2" />
            </div>
          </div>
        </div>
      </section>

      {/* メディア限定情報（任意） */}
      <section className="mt-6 rounded border border-gray-200 p-4">
        <label className={labelCls}>{t("mediaOnlyInfo")}</label>
        <p className="mt-1 text-xs text-gray-500">{t("mediaOnlyInfoNote")}</p>
        <textarea value={form.mediaOnlyInfo} rows={4} disabled={!editable}
          onChange={(e) => set("mediaOnlyInfo", e.target.value)} className={inputCls} />
      </section>

      {/* メディアキット */}
      <section className="mt-6 rounded border border-gray-200 p-4">
        <p className={labelCls}>{t("mediaKit")}</p>
        <ul className="mt-2 space-y-1 text-sm">
          {kitFiles.map((f) => (
            <li key={f.id} className="flex items-center gap-2">
              <span>{f.fileName}{" "}
                <span className="text-gray-400">({(f.fileSize / 1024 / 1024).toFixed(1)}MB)</span>
              </span>
              {editable && (
                <button type="button" onClick={() => deleteKitFile(f.id)} className="text-red-600 hover:underline">✕</button>
              )}
            </li>
          ))}
        </ul>
        <label className="mt-2 inline-block">
          <span className="cursor-pointer rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
            {uploadingKit ? "..." : t("uploadFile")}
          </span>
          <input type="file" className="hidden" disabled={!editable || uploadingKit}
            accept=".zip,.pdf,image/jpeg,image/png,image/webp,image/gif,application/zip,application/pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadKitFile(f);
              e.target.value = "";
            }} />
        </label>
      </section>

      {/* 配信 */}
      <section className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={save} disabled={saving || !editable}
            className="rounded border border-gray-400 px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-50">
            {saving ? "..." : t("saveDraft")}
          </button>
          {["DRAFT", "UNPUBLISHED"].includes(status) && (
            <>
              <label className="text-sm text-gray-600">
                {t("scheduledAt")}
                <input type="datetime-local" value={scheduledAtLocal}
                  onChange={(e) => setScheduledAtLocal(e.target.value)}
                  className="ml-2 rounded border border-gray-300 px-2 py-1.5" />
              </label>
              <button type="button" onClick={distribute} disabled={submitting}
                className="rounded bg-[#d51f1a] px-6 py-2 font-semibold text-white hover:bg-[#b3160f] disabled:opacity-50">
                {submitting ? "..." : t("distribute")}
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
