import type { MetadataRoute } from "next";
import { siteConfig } from "../../config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/*/dashboard",
          "/*/admin",
          "/*/media-room",
          "/*/login",
          "/*/register",
          "/*/preview/",
          "/*/search",
        ],
      },
    ],
    sitemap: [`${siteConfig.url}/sitemap.xml`, `${siteConfig.url}/news-sitemap.xml`],
  };
}
