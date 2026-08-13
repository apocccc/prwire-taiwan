"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ConsentCheckboxes } from "../ConsentCheckboxes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

type FieldName =
  | "email"
  | "password"
  | "outletName"
  | "outletUrl"
  | "contactName"
  | "contactTitle"
  | "contactEmail"
  | "contactPhone"
  | "coverageArea";

export function MediaRegisterForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [values, setValues] = useState<Record<FieldName, string>>({
    email: "",
    password: "",
    outletName: "",
    outletUrl: "",
    contactName: "",
    contactTitle: "",
    contactEmail: "",
    contactPhone: "",
    coverageArea: "",
  });
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function fieldError(name: FieldName, v: string): string | null {
    switch (name) {
      case "email":
        return EMAIL_RE.test(v) ? null : t("fieldErrors.email");
      case "password":
        return v.length >= 8 ? null : t("fieldErrors.password");
      case "outletName":
        return v.trim().length >= 1 ? null : t("fieldErrors.outletName");
      case "outletUrl":
        return URL_RE.test(v) ? null : t("fieldErrors.outletUrl");
      case "contactName":
        return v.trim().length >= 1 ? null : t("fieldErrors.contactName");
      case "contactTitle":
        return v.length <= 100 ? null : t("fieldErrors.contactTitle");
      case "contactEmail":
        return EMAIL_RE.test(v) ? null : t("fieldErrors.contactEmail");
      case "contactPhone":
        return v.length <= 50 ? null : t("fieldErrors.contactPhone");
      case "coverageArea":
        return v.trim().length >= 1 ? null : t("fieldErrors.coverageArea");
    }
  }

  function setField(name: FieldName, v: string) {
    setValues((s) => ({ ...s, [name]: v }));
    setTouched((s) => ({ ...s, [name]: true }));
  }
  function markTouched(name: FieldName) {
    setTouched((s) => ({ ...s, [name]: true }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    const allTouched = Object.fromEntries(
      (Object.keys(values) as FieldName[]).map((k) => [k, true])
    ) as Record<FieldName, boolean>;
    setTouched(allTouched);
    const anyError = (Object.keys(values) as FieldName[]).some((k) =>
      fieldError(k, values[k])
    );
    if (anyError) return;

    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "media",
        email: values.email,
        password: values.password,
        outletName: values.outletName,
        outletUrl: values.outletUrl,
        contactName: values.contactName,
        contactTitle: values.contactTitle,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        coverageArea: values.coverageArea,
        consentTerms: form.get("consentTerms") === "on",
        consentPrivacy: form.get("consentPrivacy") === "on",
      }),
    });
    setLoading(false);
    if (res.ok) {
      alert(t("registerSuccessMedia"));
      router.push(`/${locale}/login`);
      return;
    }
    const body = await res.json().catch(() => null);
    if (body?.error === "email_taken") setServerError(t("emailTaken"));
    else setServerError(t("registerFailed"));
  }

  const inputCls = (name: FieldName) =>
    `mt-1 w-full rounded border px-3 py-2 ${
      touched[name] && fieldError(name, values[name])
        ? "border-red-400 bg-red-50"
        : "border-gray-300"
    }`;

  function FieldError({ name }: { name: FieldName }) {
    const err = touched[name] ? fieldError(name, values[name]) : null;
    if (!err) return null;
    return <p className="mt-1 text-xs text-red-600">{err}</p>;
  }

  const field = (name: FieldName, label: string, type = "text") => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">{label}</label>
      <input id={name} name={name} type={type}
        value={values[name]} onChange={(e) => setField(name, e.target.value)}
        onBlur={() => markTouched(name)} className={inputCls(name)} />
      <FieldError name={name} />
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
      {serverError && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}
      {field("email", tCommon("email"), "email")}
      {field("password", tCommon("password"), "password")}
      {field("outletName", t("outletName"))}
      {field("outletUrl", t("outletUrl"), "url")}
      {field("contactName", t("contactName"))}
      {field("contactTitle", t("contactTitle"))}
      <div>
        <label htmlFor="contactEmail" className="block text-sm font-medium">{t("contactEmail")}</label>
        <input id="contactEmail" name="contactEmail" type="email"
          value={values.contactEmail} onChange={(e) => setField("contactEmail", e.target.value)}
          onBlur={() => markTouched("contactEmail")} className={inputCls("contactEmail")} />
        <FieldError name="contactEmail" />
        <p className="mt-1 text-xs text-gray-500">{t("contactPersonNote")}</p>
      </div>
      {field("contactPhone", t("contactPhone"), "tel")}
      {field("coverageArea", t("coverageArea"))}

      <ConsentCheckboxes />
      <button type="submit" disabled={loading}
        className="w-full rounded bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-700 disabled:opacity-50">
        {loading ? tCommon("loading") : tCommon("register")}
      </button>
    </form>
  );
}
