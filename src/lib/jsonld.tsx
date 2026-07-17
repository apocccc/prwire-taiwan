import { siteConfig, type Locale } from "../../config/site";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function websiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name[locale],
    url: `${siteConfig.url}/${locale}`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/${locale}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  /** ロケール込みの絶対URL。最後の要素は省略可 */
  url?: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export function newsArticleJsonLd(opts: {
  locale: Locale;
  url: string;
  headline: string;
  description?: string;
  images: string[];
  datePublished: Date;
  dateModified: Date;
  authorName: string;
  authorUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
    headline: opts.headline,
    ...(opts.description ? { description: opts.description } : {}),
    image: opts.images,
    datePublished: opts.datePublished.toISOString(),
    dateModified: opts.dateModified.toISOString(),
    author: {
      "@type": "Organization",
      name: opts.authorName,
      ...(opts.authorUrl ? { url: opts.authorUrl } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name[opts.locale],
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}${siteConfig.logoPath}`,
      },
    },
  };
}

export function organizationJsonLd(opts: {
  name: string;
  url: string;
  logo?: string | null;
  description?: string | null;
  sameAs?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: opts.name,
    url: opts.url,
    ...(opts.logo ? { logo: opts.logo } : {}),
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.sameAs ? { sameAs: [opts.sameAs] } : {}),
  };
}
