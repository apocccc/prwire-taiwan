"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function NewReleaseButton({ locale }: { locale: string }) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    const res = await fetch("/api/releases", { method: "POST" });
    setLoading(false);
    if (!res.ok) return;
    const { id } = await res.json();
    router.push(`/${locale}/dashboard/releases/${id}`);
  }

  return (
    <button
      type="button"
      onClick={create}
      disabled={loading}
      className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
    >
      {loading ? "..." : `+ ${t("newRelease")}`}
    </button>
  );
}

export function ReleaseRowActions({
  releaseId,
  status,
  locale,
}: {
  releaseId: string;
  status: string;
  locale: string;
}) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function call(path: string, method = "POST") {
    setBusy(true);
    const res = await fetch(path, { method });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  async function duplicate() {
    setBusy(true);
    const res = await fetch(`/api/releases/${releaseId}/duplicate`, { method: "POST" });
    setBusy(false);
    if (!res.ok) return;
    const { id } = await res.json();
    router.push(`/${locale}/dashboard/releases/${id}`);
  }

  const btn = "text-blue-700 hover:underline disabled:opacity-50";

  return (
    <span className="flex flex-wrap gap-3 text-sm">
      <a href={`/${locale}/dashboard/releases/${releaseId}`} className={btn}>
        {tCommon("edit")}
      </a>
      <a
        href={`/${locale}/dashboard/releases/${releaseId}/preview`}
        target="_blank"
        className={btn}
      >
        {t("preview")}
      </a>
      <button type="button" onClick={duplicate} disabled={busy} className={btn}>
        {t("duplicate")}
      </button>
      {["PUBLISHED", "SCHEDULED", "IN_REVIEW"].includes(status) && (
        <button
          type="button"
          onClick={() => call(`/api/releases/${releaseId}/unpublish`)}
          disabled={busy}
          className="text-amber-700 hover:underline disabled:opacity-50"
        >
          {t("unpublish")}
        </button>
      )}
      {["DRAFT", "UNPUBLISHED"].includes(status) && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Delete?")) call(`/api/releases/${releaseId}`, "DELETE");
          }}
          disabled={busy}
          className="text-red-600 hover:underline disabled:opacity-50"
        >
          {tCommon("delete")}
        </button>
      )}
    </span>
  );
}
