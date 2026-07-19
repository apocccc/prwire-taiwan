import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// R2 の公開配信ドメイン（例: https://img.taiwanpublicwire.com）
const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
const r2Host = r2PublicUrl ? new URL(r2PublicUrl).hostname : null;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
    // 企業ロゴ等の SVG を next/image で表示可能にする。
    // <img> 経由の描画のみで、インライン展開はしないため実行はされない。
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // R2 のカスタムドメインを許可。R2 使用時は Vercel の画像最適化を経由させない
    // （コスト回避。R2/Cloudflare 側の配信・キャッシュに任せる）。
    ...(r2Host
      ? {
          unoptimized: true,
          remotePatterns: [{ protocol: "https", hostname: r2Host }],
        }
      : {}),
  },
};

export default withNextIntl(nextConfig);
