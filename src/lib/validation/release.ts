import { z } from "zod";
import { collectBodyImages } from "@/lib/tiptap-render";

export const MAX_BODY_IMAGES = 10;

const tiptapDoc = z
  .object({ type: z.literal("doc") })
  .passthrough()
  .nullable()
  .optional();

/** 下書き保存の入力（緩い制約。公開時の必須チェックは validateForPublish で行う） */
export const releaseDraftSchema = z.object({
  titleZh: z.string().max(200).nullable().optional(),
  subtitleZh: z.string().max(300).nullable().optional(),
  bodyZh: tiptapDoc,
  titleEn: z.string().max(200).nullable().optional(),
  subtitleEn: z.string().max(300).nullable().optional(),
  bodyEn: tiptapDoc,
  metaDescriptionZh: z.string().max(300).nullable().optional(),
  metaDescriptionEn: z.string().max(300).nullable().optional(),
  thumbnailUrl: z.string().max(1000).nullable().optional(),
  thumbnailCaption: z.string().max(300).nullable().optional(),
  customSlug: z
    .string()
    .max(60)
    .regex(/^[a-zA-Z0-9-]*$/)
    .optional(),
  categoryIds: z.array(z.string()).max(10).optional(),
  mediaOnlyInfo: z.string().max(10000).nullable().optional(),
});

export type ReleaseDraftInput = z.infer<typeof releaseDraftSchema>;

export const submitSchema = z.object({
  scheduledAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export interface ReleaseLike {
  titleZh: string | null;
  subtitleZh: string | null;
  bodyZh: unknown;
  titleEn: string | null;
  subtitleEn: string | null;
  bodyEn: unknown;
  thumbnailUrl: string | null;
  thumbnailCaption: string | null;
}

/** 本文画像の抽出（zh/en 両方、src で一意化） */
export function extractAllBodyImages(release: {
  bodyZh: unknown;
  bodyEn: unknown;
}): { src: string; caption: string }[] {
  const map = new Map<string, { src: string; caption: string }>();
  for (const img of [
    ...collectBodyImages(release.bodyZh),
    ...collectBodyImages(release.bodyEn),
  ]) {
    if (img.src && !map.has(img.src)) map.set(img.src, img);
  }
  return [...map.values()];
}

export type PublishErrorCode =
  | "errNoLanguage"
  | "errThumbnail"
  | "errImageCaptions"
  | "errTooManyImages";

/**
 * 配信申請時のバリデーション。
 * - 少なくとも1言語が完全（タイトル・サブタイトル・本文）
 * - サムネイル + キャプション必須
 * - 本文画像は全てキャプション必須・最大10枚
 */
export function validateForPublish(release: ReleaseLike): PublishErrorCode[] {
  const errors: PublishErrorCode[] = [];

  const zhComplete = !!(release.titleZh && release.subtitleZh && release.bodyZh);
  const enComplete = !!(release.titleEn && release.subtitleEn && release.bodyEn);
  if (!zhComplete && !enComplete) errors.push("errNoLanguage");

  if (!release.thumbnailUrl || !release.thumbnailCaption?.trim()) {
    errors.push("errThumbnail");
  }

  const images = extractAllBodyImages(release);
  if (images.some((img) => !img.caption.trim())) errors.push("errImageCaptions");
  if (images.length > MAX_BODY_IMAGES) errors.push("errTooManyImages");

  return errors;
}
