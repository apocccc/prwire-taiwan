"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

/** モバイルヘッダー右側: 検索アイコン＋（未ログイン時のみ）無料発布CTA。 */
export function MobileHeaderActions({ registerLabel, searchLabel }: { registerLabel: string; searchLabel: string }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && setLoggedIn(Boolean(d?.user)))
      .catch(() => active && setLoggedIn(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      {loggedIn === false && (
        <Link
          href="/register/publisher"
          className="rounded bg-[#d51f1a] px-3 py-1.5 text-xs font-semibold text-white"
        >
          {registerLabel}
        </Link>
      )}
      <Link
        href="/search"
        aria-label={searchLabel}
        className="inline-flex h-9 w-9 items-center justify-center rounded text-gray-700 hover:bg-gray-100"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </Link>
    </div>
  );
}
