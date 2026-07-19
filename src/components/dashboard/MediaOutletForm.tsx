"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export interface MediaOutletInfo {
  outletName: string;
  outletUrl: string;
  contactName: string;
  contactTitle: string | null;
  contactEmail: string;
  contactPhone: string | null;
  coverageArea: string;
}

export function MediaOutletForm({ initial }: { initial: MediaOutletInfo }) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tOutlet = useTranslations("mediaOutletForm");
  const router = useRouter();

  const [form, setForm] = useState({
    outletName: initial.outletName ?? "",
    outletUrl: initial.outletUrl ?? "",
    contactName: initial.contactName ?? "",
    contactTitle: initial.contactTitle ?? "",
    contactEmail: initial.contactEmail ?? "",
    contactPhone: initial.contactPhone ?? "",
    coverageArea: initial.coverageArea ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    const res = await fetch("/api/media-outlet", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        contactTitle: form.contactTitle || null,
        contactPhone: form.contactPhone || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(tOutlet("saveFailed"));
      return;
    }
    setMessage(tCommon("save"));
    router.refresh();
  }

  const inputCls = "mt-1 w-full rounded border border-gray-300 px-3 py-2";
  const labelCls = "block text-sm font-medium";

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <div>
        <label className={labelCls}>{t("outletName")}</label>
        <input type="text" value={form.outletName} onChange={(e) => set("outletName", e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>{t("outletUrl")}</label>
        <input type="url" value={form.outletUrl} onChange={(e) => set("outletUrl", e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>{t("contactName")}</label>
        <input type="text" value={form.contactName} onChange={(e) => set("contactName", e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>{t("contactTitle")}</label>
        <input type="text" value={form.contactTitle} onChange={(e) => set("contactTitle", e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>{t("contactEmail")}</label>
        <input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>{t("contactPhone")}</label>
        <input type="tel" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>{t("coverageArea")}</label>
        <input type="text" value={form.coverageArea} onChange={(e) => set("coverageArea", e.target.value)} className={inputCls} />
      </div>

      <button type="button" onClick={save} disabled={saving}
        className="rounded bg-gray-900 px-5 py-2 font-medium text-white hover:bg-gray-700 disabled:opacity-50">
        {saving ? "..." : tCommon("save")}
      </button>
    </div>
  );
}
