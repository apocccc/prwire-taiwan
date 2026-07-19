"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

/* eslint-disable @next/next/no-img-element */

export interface CompanyProfile {
  nameZh: string;
  nameEn: string | null;
  descriptionZh: string | null;
  descriptionEn: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  address: string | null;
  representativeName: string | null;
  capital: string | null;
  snsX: string | null;
  snsFacebook: string | null;
  snsInstagram: string | null;
  snsLine: string | null;
  snsYoutube: string | null;
  snsLinkedin: string | null;
}

export function CompanyProfileForm({ initial }: { initial: CompanyProfile }) {
  const t = useTranslations("companyProfile");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nameZh: initial.nameZh ?? "",
    nameEn: initial.nameEn ?? "",
    descriptionZh: initial.descriptionZh ?? "",
    descriptionEn: initial.descriptionEn ?? "",
    websiteUrl: initial.websiteUrl ?? "",
    logoUrl: initial.logoUrl ?? "",
    address: initial.address ?? "",
    representativeName: initial.representativeName ?? "",
    capital: initial.capital ?? "",
    snsX: initial.snsX ?? "",
    snsFacebook: initial.snsFacebook ?? "",
    snsInstagram: initial.snsInstagram ?? "",
    snsLine: initial.snsLine ?? "",
    snsYoutube: initial.snsYoutube ?? "",
    snsLinkedin: initial.snsLinkedin ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function uploadLogo(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads/image", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      setError(t("uploadFailed"));
      return;
    }
    const { url } = await res.json();
    set("logoUrl", url);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    const res = await fetch("/api/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameZh: form.nameZh,
        nameEn: form.nameEn || null,
        descriptionZh: form.descriptionZh || null,
        descriptionEn: form.descriptionEn || null,
        websiteUrl: form.websiteUrl || "",
        logoUrl: form.logoUrl || null,
        address: form.address || null,
        representativeName: form.representativeName || null,
        capital: form.capital || null,
        snsX: form.snsX || "",
        snsFacebook: form.snsFacebook || "",
        snsInstagram: form.snsInstagram || "",
        snsLine: form.snsLine || "",
        snsYoutube: form.snsYoutube || "",
        snsLinkedin: form.snsLinkedin || "",
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(t("saveFailed"));
      return;
    }
    setMessage(tCommon("save"));
    router.refresh();
  }

  const inputCls = "mt-1 w-full rounded border border-gray-300 px-3 py-2";
  const labelCls = "block text-sm font-medium";

  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {message && <p className="text-sm text-green-700">{message}</p>}

      {/* ロゴ */}
      <section className="rounded border border-gray-200 p-4">
        <h2 className="font-semibold">{t("logo")}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          {form.logoUrl ? (
            <img src={form.logoUrl} alt="" className="h-20 w-20 rounded border border-gray-200 bg-white object-contain" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">
              LOGO
            </div>
          )}
          <div className="space-y-2">
            <button type="button" onClick={() => logoInputRef.current?.click()}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
              {uploading ? "..." : t("uploadLogo")}
            </button>
            {form.logoUrl && (
              <button type="button" onClick={() => set("logoUrl", "")}
                className="ml-2 text-sm text-red-600 hover:underline">
                {tCommon("delete")}
              </button>
            )}
            <p className="text-xs text-gray-500">{t("logoNote")}</p>
          </div>
        </div>
        <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadLogo(f);
            e.target.value = "";
          }} />
      </section>

      <div>
        <label className={labelCls}>{t("nameZh")}</label>
        <input type="text" value={form.nameZh} onChange={(e) => set("nameZh", e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>{t("nameEn")}</label>
        <input type="text" value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>{t("descriptionZh")}</label>
        <textarea rows={3} value={form.descriptionZh} onChange={(e) => set("descriptionZh", e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>{t("websiteUrl")}</label>
        <input type="url" value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} className={inputCls} />
      </div>

      {/* 会社基本情報（プレスリリースと合わせて掲載） */}
      <div className="rounded border border-gray-200 p-4">
        <h2 className="font-semibold">{t("basicInfo")}</h2>
        <p className="mt-1 text-xs text-gray-500">{t("basicInfoNote")}</p>
        <div className="mt-3 space-y-4">
          <div>
            <label className={labelCls}>{t("address")}</label>
            <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t("representativeName")}</label>
            <input type="text" value={form.representativeName} onChange={(e) => set("representativeName", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t("capital")}</label>
            <input type="text" value={form.capital} onChange={(e) => set("capital", e.target.value)} className={inputCls} placeholder={t("capitalPlaceholder")} />
          </div>
        </div>
      </div>

      {/* SNS リンク */}
      <div className="rounded border border-gray-200 p-4">
        <h2 className="font-semibold">{t("sns")}</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {([
            ["snsX", "X"],
            ["snsFacebook", "Facebook"],
            ["snsInstagram", "Instagram"],
            ["snsLine", "LINE"],
            ["snsYoutube", "YouTube"],
            ["snsLinkedin", "LinkedIn"],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input
                type="url"
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                className={inputCls}
                placeholder="https://"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={saving}
          className="rounded bg-gray-900 px-5 py-2 font-medium text-white hover:bg-gray-700 disabled:opacity-50">
          {saving ? "..." : tCommon("save")}
        </button>
        <a href={`/${locale}/dashboard`} className="text-sm text-gray-500 hover:underline">
          {tCommon("backToList")}
        </a>
      </div>
    </div>
  );
}
