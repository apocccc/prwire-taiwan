"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ConsentCheckboxes } from "../ConsentCheckboxes";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

type FieldName =
  | "email"
  | "password"
  | "companyNameZh"
  | "companyNameEn"
  | "companySlug"
  | "websiteUrl";

export function PublisherRegisterForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [values, setValues] = useState<Record<FieldName, string>>({
    email: "",
    password: "",
    companyNameZh: "",
    companyNameEn: "",
    companySlug: "",
    websiteUrl: "",
  });
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** 各項目のリアルタイム検証（サーバーの zod と同じルール）。問題なければ null */
  function fieldError(name: FieldName, v: string): string | null {
    switch (name) {
      case "email":
        return EMAIL_RE.test(v) ? null : t("fieldErrors.email");
      case "password":
        return v.length >= 8 ? null : t("fieldErrors.password");
      case "companyNameZh":
        return v.trim().length >= 1 ? null : t("fieldErrors.companyNameZh");
      case "companyNameEn":
        return v.length <= 200 ? null : t("fieldErrors.companyNameEn");
      case "companySlug":
        return SLUG_RE.test(v) && v.length >= 2 && v.length <= 50
          ? null
          : t("fieldErrors.companySlug");
      case "websiteUrl":
        return v === "" || URL_RE.test(v) ? null : t("fieldErrors.websiteUrl");
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
    // 送信時は全項目を touched 扱いにして未入力エラーも表示
    setTouched({
      email: true,
      password: true,
      companyNameZh: true,
      companyNameEn: true,
      companySlug: true,
      websiteUrl: true,
    });
    const anyError = (Object.keys(values) as FieldName[]).some((k) =>
      fieldError(k, values[k])
    );
    if (anyError) return; // クライアント側で不備があれば送信しない

    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "publisher",
        email: values.email,
        password: values.password,
        companyNameZh: values.companyNameZh,
        companyNameEn: values.companyNameEn,
        companySlug: values.companySlug,
        websiteUrl: values.websiteUrl,
        consentTerms: form.get("consentTerms") === "on",
        consentPrivacy: form.get("consentPrivacy") === "on",
      }),
    });
    setLoading(false);
    if (res.ok) {
      alert(t("registerSuccessPublisher"));
      router.push(`/${locale}/login`);
      return;
    }
    const body = await res.json().catch(() => null);
    if (body?.error === "email_taken") setServerError(t("emailTaken"));
    else if (body?.error === "slug_taken") setServerError(t("slugTaken"));
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

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
      {serverError && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium">{tCommon("email")}</label>
        <input id="email" name="email" type="email" autoComplete="email"
          value={values.email} onChange={(e) => setField("email", e.target.value)}
          onBlur={() => markTouched("email")} className={inputCls("email")} />
        <FieldError name="email" />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">{tCommon("password")}</label>
        <input id="password" name="password" type="password" autoComplete="new-password"
          value={values.password} onChange={(e) => setField("password", e.target.value)}
          onBlur={() => markTouched("password")} className={inputCls("password")} />
        <FieldError name="password" />
      </div>

      <div>
        <label htmlFor="companyNameZh" className="block text-sm font-medium">{t("companyNameZh")}</label>
        <input id="companyNameZh" name="companyNameZh" type="text"
          value={values.companyNameZh} onChange={(e) => setField("companyNameZh", e.target.value)}
          onBlur={() => markTouched("companyNameZh")} className={inputCls("companyNameZh")} />
        <FieldError name="companyNameZh" />
      </div>

      <div>
        <label htmlFor="companyNameEn" className="block text-sm font-medium">{t("companyNameEn")}</label>
        <input id="companyNameEn" name="companyNameEn" type="text"
          value={values.companyNameEn} onChange={(e) => setField("companyNameEn", e.target.value)}
          onBlur={() => markTouched("companyNameEn")} className={inputCls("companyNameEn")} />
        <FieldError name="companyNameEn" />
      </div>

      <div>
        <label htmlFor="companySlug" className="block text-sm font-medium">{t("companySlug")}</label>
        <input id="companySlug" name="companySlug" type="text" placeholder="taiwan-news"
          value={values.companySlug} onChange={(e) => setField("companySlug", e.target.value)}
          onBlur={() => markTouched("companySlug")} className={inputCls("companySlug")} />
        {touched.companySlug && fieldError("companySlug", values.companySlug) ? (
          <FieldError name="companySlug" />
        ) : (
          <p className="mt-1 text-xs text-gray-500">{t("slugHint")}</p>
        )}
      </div>

      <div>
        <label htmlFor="websiteUrl" className="block text-sm font-medium">{t("websiteUrl")}</label>
        <input id="websiteUrl" name="websiteUrl" type="url"
          value={values.websiteUrl} onChange={(e) => setField("websiteUrl", e.target.value)}
          onBlur={() => markTouched("websiteUrl")} className={inputCls("websiteUrl")} />
        <FieldError name="websiteUrl" />
      </div>

      <ConsentCheckboxes />
      <button type="submit" disabled={loading}
        className="w-full rounded bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-700 disabled:opacity-50">
        {loading ? tCommon("loading") : tCommon("register")}
      </button>
    </form>
  );
}
