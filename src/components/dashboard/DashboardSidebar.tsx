"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";

export interface SidebarItem {
  href: string;
  label: string;
}

/** 事業者ダッシュボードの左メニュー（現在地をハイライト） */
export function DashboardSidebar({
  items,
  locale,
}: {
  items: SidebarItem[];
  locale: string;
}) {
  const pathname = usePathname();
  // pathname は /{locale}/dashboard/... を含むため locale プレフィックスを除去して比較
  const stripped = pathname.replace(new RegExp(`^/${locale}`), "") || "/";

  // 現在地に一致する最長プレフィックスの項目のみをアクティブにする
  const activeHref = items
    .filter(
      (item) => stripped === item.href || stripped.startsWith(item.href + "/")
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav aria-label="Dashboard" className="space-y-1">
      {items.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded px-3 py-2 text-sm font-medium ${
              active
                ? "bg-[#d51f1a]/10 text-[#d51f1a]"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
