import type { Metadata } from "next";
import { siteConfig, type Locale } from "../../config/site";

/** title は60字以内に切り詰める */
export function truncateTitle(title: string, max = 60): string {
  return title.length > max ? `${title.slice(0, max - 1)}…` : title;
}

/** meta description 用に150字へ切り詰める */
export function truncateDescription(text: string, max = 150): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export interface BuildMetadataOptions {
  locale: Locale;
  /** ロケールを除いたパス（例: "/news/abc123"、トップは "/"） */
  path: string;
  title?: string;
  description?: string;
  /** このコンテンツが存在する言語（hreflang 出力対象）。省略時は全ロケール */
  availableLocales?: Locale[];
  ogImage?: { url: string; width?: number; height?: number; alt?: string };
  ogType?: "website" | "article";
  publishedTime?: Date | null;
  modifiedTime?: Date | null;
  noindex?: boolean;
}

function localeUrl(locale: Locale, path: string): string {
  const p = path === "/" ? "" : path;
  return `${siteConfig.url}/${locale}${p}`;
}

/**
 * 全公開ページ共通のメタデータ生成。
 * canonical / hreflang(zh-Hant, en, x-default) / OGP / Twitter カードを一括出力する。
 */
export function buildMetadata(opts: BuildMetadataOptions): Metadata {
  const {
    locale,
    path,
    availableLocales = [...siteConfig.locales],
    ogImage,
    ogType = "website",
  } = opts;

  const title = opts.title ? truncateTitle(opts.title) : siteConfig.name[locale];
  const description = opts.description
    ? truncateDescription(opts.description)
    : siteConfig.description[locale];

  // hreflang: 存在する言語のみ + x-default（デフォルトロケール優先）
  const languages: Record<string, string> = {};
  for (const l of availableLocales) {
    languages[siteConfig.hreflang[l]] = localeUrl(l, path);
  }
  const xDefaultLocale = availableLocales.includes(siteConfig.defaultLocale)
    ? siteConfig.defaultLocale
    : availableLocales[0];
  if (xDefaultLocale) {
    languages["x-default"] = localeUrl(xDefaultLocale, path);
  }

  const canonical = localeUrl(locale, path);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: ogType,
      url: canonical,
      siteName: siteConfig.name[locale],
      locale: siteConfig.ogLocale[locale],
      title,
      description,
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage.url,
                width: ogImage.width,
                height: ogImage.height,
                alt: ogImage.alt,
              },
            ],
          }
        : {}),
      ...(ogType === "article" && opts.publishedTime
        ? {
            publishedTime: opts.publishedTime.toISOString(),
            ...(opts.modifiedTime
              ? { modifiedTime: opts.modifiedTime.toISOString() }
              : {}),
          }
        : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage.url] } : {}),
    },
  };
}
