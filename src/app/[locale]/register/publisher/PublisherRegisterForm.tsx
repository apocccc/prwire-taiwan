"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ConsentCheckboxes } from "../ConsentCheckboxes";

export function PublisherRegisterForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldMsgs, setFieldMsgs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldMsgs([]);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "publisher",
        email: form.get("email"),
        password: form.get("password"),
        companyNameZh: form.get("companyNameZh"),
        companyNameEn: form.get("companyNameEn"),
        companySlug: form.get("companySlug"),
        websiteUrl: form.get("websiteUrl"),
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
    if (body?.error === "email_taken") setError(t("emailTaken"));
    else if (body?.error === "slug_taken") setError(t("slugTaken"));
    else if (body?.error === "validation_failed") {
      const fe = (body?.details?.fieldErrors ?? {}) as Record<string, string[]>;
      const msgs = Object.keys(fe)
        .filter((k) => t.has(`fieldErrors.${k}` as never))
        .map((k) => t(`fieldErrors.${k}` as never));
      if (msgs.length) setFieldMsgs(msgs);
      else setError(t("registerInvalidInput"));
    } else setError(t("registerFailed"));
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {fieldMsgs.length > 0 && (
        <div role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          <p className="font-medium">{t("registerInvalidInput")}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {fieldMsgs.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          {tCommon("email")}
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          {tCommon("password")}
        </label>
        <input id="password" name="password" type="password" autoComplete="new-password"
          required minLength={8}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="companyNameZh" className="block text-sm font-medium">
          {t("companyNameZh")}
        </label>
        <input id="companyNameZh" name="companyNameZh" type="text" required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="companyNameEn" className="block text-sm font-medium">
          {t("companyNameEn")}
        </label>
        <input id="companyNameEn" name="companyNameEn" type="text"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="companySlug" className="block text-sm font-medium">
          {t("companySlug")}
        </label>
        <input id="companySlug" name="companySlug" type="text" required
          pattern="[a-z0-9](?:[a-z0-9-]*[a-z0-9])?" minLength={2} maxLength={50}
          placeholder="taiwan-news"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        <p className="mt-1 text-xs text-gray-500">{t("slugHint")}</p>
      </div>
      <div>
        <label htmlFor="websiteUrl" className="block text-sm font-medium">
          {t("websiteUrl")}
        </label>
        <input id="websiteUrl" name="websiteUrl" type="url"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
      </div>
      <ConsentCheckboxes />
      <button type="submit" disabled={loading}
        className="w-full rounded bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-700 disabled:opacity-50">
        {loading ? tCommon("loading") : tCommon("register")}
      </button>
    </form>
  );
}
