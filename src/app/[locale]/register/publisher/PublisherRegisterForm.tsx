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
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
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
    else setError(t("registerFailed"));
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
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
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
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
