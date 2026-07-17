"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { siteConfig } from "../../config/site";

const LABELS: Record<string, string> = { zh: "繁體中文", en: "English" };

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="text-sm">
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value as "zh" | "en" })}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      >
        {siteConfig.locales.map((l) => (
          <option key={l} value={l}>
            {LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
