"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Link } from "@/i18n/navigation";

interface Labels {
  freeDistribute: string;
  companyLogin: string;
  mediaLogin: string;
  dashboard: string;
  mediaRoom: string;
  logout: string;
}

type SessionUser = { role?: string } | null;

/**
 * ヘッダー右上のナビ。
 * 公開ページを静的/ISRのまま保つため、ログイン状態はクライアントで判定する
 * （レイアウトで auth() を呼ぶと全ページが動的化しSEOキャッシュが効かなくなるため）。
 * 既定（判定前・SSR・クローラー）はログアウト表示にし、
 * セッションが確認できた場合のみログイン表示へ切り替える。
 */
export function HeaderAuthNav({ locale, labels }: { locale: string; labels: Labels }) {
  const [user, setUser] = useState<SessionUser>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const linkCls =
    "rounded border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:border-[#d51f1a] hover:text-[#d51f1a] sm:text-sm";

  if (user) {
    const isMedia = user.role === "MEDIA";
    return (
      <>
        <Link href={isMedia ? "/media-room" : "/dashboard"} className={linkCls}>
          {isMedia ? labels.mediaRoom : labels.dashboard}
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
          className="rounded border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 sm:text-sm"
        >
          {labels.logout}
        </button>
      </>
    );
  }

  return (
    <>
      <Link
        href="/register/publisher"
        className="rounded bg-[#d51f1a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#b3160f] sm:text-sm"
      >
        {labels.freeDistribute}
      </Link>
      <Link href="/login" className={linkCls}>
        {labels.companyLogin}
      </Link>
      <Link href="/login" className={linkCls}>
        {labels.mediaLogin}
      </Link>
    </>
  );
}
