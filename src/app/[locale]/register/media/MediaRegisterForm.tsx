"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ConsentCheckboxes } from "../ConsentCheckboxes";

export function MediaRegisterForm() {
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
        type: "media",
        email: form.get("email"),
        password: form.get("password"),
        outletName: form.get("outletName"),
        outletUrl: form.get("outletUrl"),
        contactName: form.get("contactName"),
        contactEmail: form.get("contactEmail"),
        coverageArea: form.get("coverageArea"),
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
    if (body?.error === "email_taken") setError(t("emailTaken"));
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
        <label htmlFor="outletName" className="block text-sm font-medium">
          {t("outletName")}
        </label>
        <input id="outletName" name="outletName" type="text" required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="outletUrl" className="block text-sm font-medium">
          {t("outletUrl")}
        </label>
        <input id="outletUrl" name="outletUrl" type="url" required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="contactName" className="block text-sm font-medium">
          {t("contactName")}
        </label>
        <input id="contactName" name="contactName" type="text" required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="contactEmail" className="block text-sm font-medium">
          {t("contactEmail")}
        </label>
        <input id="contactEmail" name="contactEmail" type="email" required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        <p className="mt-1 text-xs text-gray-500">{t("contactPersonNote")}</p>
      </div>
      <div>
        <label htmlFor="coverageArea" className="block text-sm font-medium">
          {t("coverageArea")}
        </label>
        <input id="coverageArea" name="coverageArea" type="text" required
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
