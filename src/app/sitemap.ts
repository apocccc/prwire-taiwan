import type { MetadataRoute } from "next";
import { getAllPublishedForSitemap } from "@/lib/queries";
import { articlePath } from "@/lib/article-url";
import { siteConfig } from "../../config/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const entries: MetadataRoute.Sitemap = [];

  // 静的ページ（各ロケール）
  const staticPaths = ["", "/news", "/media", "/terms"];
  for (const locale of siteConfig.locales) {
    for (const p of staticPaths) {
      entries.push({
        url: `${base}/${locale}${p}`,
        changeFrequency: p === "" || p === "/news" ? "hourly" : "weekly",
        priority: p === "" ? 1 : 0.7,
      });
    }
  }

  try {
    const { releases, categories, companies } = await getAllPublishedForSitemap();

    for (const r of releases) {
      const path = articlePath(r);
      if (r.titleZh) {
        entries.push({
          url: `${base}/zh${path}`,
          lastModified: r.updatedAt,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
      if (r.titleEn) {
        entries.push({
          url: `${base}/en${path}`,
          lastModified: r.updatedAt,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
    for (const locale of siteConfig.locales) {
      for (const c of categories) {
        entries.push({
          url: `${base}/${locale}/category/${c.slug}`,
          changeFrequency: "daily",
          priority: 0.6,
        });
      }
      for (const c of companies) {
        entries.push({
          url: `${base}/${locale}/company/${c.slug}`,
          lastModified: c.updatedAt,
          changeFrequency: "weekly",
          priority: 0.5,
        });
      }
    }
  } catch {
    // DB未接続時（ビルド環境など）は静的ページのみ返す
  }

  return entries;
}
