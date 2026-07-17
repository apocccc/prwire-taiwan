import { getRecentReleasesForNewsSitemap } from "@/lib/queries";
import { articlePath } from "@/lib/article-url";
import { siteConfig } from "../../../config/site";

export const revalidate = 900;

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Google News sitemap: 直近48時間に公開された記事のみを掲載する。
 * https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */
export async function GET() {
  let releases: Awaited<ReturnType<typeof getRecentReleasesForNewsSitemap>> = [];
  try {
    releases = await getRecentReleasesForNewsSitemap();
  } catch {
    // DB未接続時は空のサイトマップを返す
  }

  const urls: string[] = [];
  for (const r of releases) {
    const variants: { locale: "zh" | "en"; title: string | null }[] = [
      { locale: "zh", title: r.titleZh },
      { locale: "en", title: r.titleEn },
    ];
    const path = articlePath(r);
    for (const v of variants) {
      if (!v.title || !r.publishedAt) continue;
      urls.push(
        `  <url>
    <loc>${siteConfig.url}/${v.locale}${path}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(siteConfig.name[v.locale])}</news:name>
        <news:language>${v.locale === "zh" ? "zh-tw" : "en"}</news:language>
      </news:publication>
      <news:publication_date>${r.publishedAt.toISOString()}</news:publication_date>
      <news:title>${xmlEscape(v.title)}</news:title>
    </news:news>
  </url>`
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
}
