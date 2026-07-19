"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/** 企業フォローのトグル。ログイン中メディアにのみ表示。 */
export function FollowButton({ companyId }: { companyId: string }) {
  const t = useTranslations("engage");
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/follows?companyId=${encodeURIComponent(companyId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        if (d) {
          setVisible(true);
          setFollowing(Boolean(d.following));
        }
        setReady(true);
      })
      .catch(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, [companyId]);

  async function toggle() {
    setBusy(true);
    const res = await fetch("/api/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId }),
    });
    setBusy(false);
    if (res.ok) setFollowing((await res.json()).following);
  }

  if (!ready || !visible) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={following}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium disabled:opacity-50 ${
        following
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-300 text-gray-700 hover:bg-gray-50"
      }`}
    >
      {following ? t("following") : t("follow")}
    </button>
  );
}
