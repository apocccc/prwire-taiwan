import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // S3互換ストレージの画像最適化ドメインは Phase 3 で追加
  images: {
    formats: ["image/webp"],
    // 企業ロゴ等の SVG を next/image で表示可能にする。
    // <img> 経由の描画のみで、インライン展開はしないため実行はされない。
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default withNextIntl(nextConfig);
