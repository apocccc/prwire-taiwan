"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/** お気に入りトグル。ログイン中メディアにのみ表示（公開HTMLに状態を焼き込まずクライアントで判定）。 */
export function FavoriteButton({ releaseId }: { releaseId: string }) {
  const t = useTranslations("engage");
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/favorites?releaseId=${encodeURIComponent(releaseId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        if (d) {
          setVisible(true);
          setFavorited(Boolean(d.favorited));
        }
        setReady(true);
      })
      .catch(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, [releaseId]);

  async function toggle() {
    setBusy(true);
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ releaseId }),
    });
    setBusy(false);
    if (res.ok) setFavorited((await res.json()).favorited);
  }

  if (!ready || !visible) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={favorited}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium disabled:opacity-50 ${
        favorited
          ? "border-[#d51f1a] bg-[#d51f1a]/10 text-[#d51f1a]"
          : "border-gray-300 text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span aria-hidden="true">{favorited ? "★" : "☆"}</span>
      {favorited ? t("favorited") : t("favorite")}
    </button>
  );
}
