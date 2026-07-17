import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // S3互換ストレージの画像最適化ドメインは Phase 3 で追加
  images: {
    formats: ["image/webp"],
  },
};

export default withNextIntl(nextConfig);
