import crypto from "crypto";

/** IDベースの短いスラッグ（英数字8桁） */
export function generateShortId(): string {
  return crypto.randomBytes(6).toString("base64url").replace(/[-_]/g, "0").slice(0, 8).toLowerCase();
}

/**
 * リリースslug: 任意スラッグ + IDベース suffix（一意性担保）。
 * customSlug 未指定なら shortId のみ。
 */
export function buildReleaseSlug(shortId: string, customSlug?: string | null): string {
  const custom = (customSlug ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return custom ? `${custom}-${shortId}` : shortId;
}

/** 既存slugからIDベースsuffixを取り出す */
export function extractShortId(slug: string): string {
  const parts = slug.split("-");
  return parts[parts.length - 1];
}
