"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export interface MobileNavLabels {
  home: string;
  news: string;
  mediaList: string;
  categories: string;
  terms: string;
  privacy: string;
  freeDistribute: string;
  companyLogin: string;
  mediaLogin: string;
  dashboard: string;
  mediaRoom: string;
  logout: string;
  menu: string;
  close: string;
}

type SessionUser = { role?: string } | null;

/** モバイル用のハンバーガーメニュー（ナビ・言語・ログイン導線をドロワーに集約） */
export function MobileNav({ locale, labels }: { locale: string; labels: MobileNavLabels }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && setUser(d?.user ?? null))
      .catch(() => active && setUser(null));
    return () => {
      active = false;
    };
  }, []);

  // ドロワーを開いている間は背面スクロールを止める
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const navLinks = [
    { href: "/", label: labels.home },
    { href: "/news", label: labels.news },
    { href: "/media", label: labels.mediaList },
    { href: "/terms", label: labels.terms },
    { href: "/privacy", label: labels.privacy },
  ] as const;

  const isMedia = user?.role === "MEDIA";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.menu}
        className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded text-gray-700 hover:bg-gray-100"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[80%] overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <span className="text-sm font-semibold text-gray-500">{labels.menu}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labels.close}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* 認証導線 */}
            <div className="space-y-2 border-b border-gray-100 px-4 py-4">
              {user ? (
                <>
                  <Link
                    href={isMedia ? "/media-room" : "/dashboard"}
                    onClick={() => setOpen(false)}
                    className="block rounded border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700"
                  >
                    {isMedia ? labels.mediaRoom : labels.dashboard}
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: `/${locale}` })}
                    className="block w-full rounded border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700"
                  >
                    {labels.logout}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/register/publisher"
                    onClick={() => setOpen(false)}
                    className="block rounded bg-[#d51f1a] px-3 py-2 text-center text-sm font-semibold text-white"
                  >
                    {labels.freeDistribute}
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="block rounded border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700"
                  >
                    {labels.companyLogin}
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="block rounded border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700"
                  >
                    {labels.mediaLogin}
                  </Link>
                </>
              )}
            </div>

            {/* ナビ */}
            <nav className="px-2 py-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded px-3 py-2.5 text-sm text-gray-800 hover:bg-gray-50"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-gray-100 px-4 py-4">
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
