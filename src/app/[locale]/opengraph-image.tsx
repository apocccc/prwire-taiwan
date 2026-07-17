import { ImageResponse } from "next/og";
import { siteConfig } from "../../../config/site";

export const runtime = "edge";
export const alt = "twpr";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * デフォルトOGP画像（記事はサムネイルを優先使用）。
 * 仮称ロゴのためラテン文字のみで構成。
 */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -4 }}>
          {siteConfig.codeName}
        </div>
        <div style={{ fontSize: 36, color: "#9ca3af", marginTop: 20 }}>
          Taiwan Press Release Wire
        </div>
      </div>
    ),
    size
  );
}
