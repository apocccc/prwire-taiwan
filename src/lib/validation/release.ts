import { z } from "zod";
import { collectBodyImages } from "@/lib/tiptap-render";
import { PURPOSES } from "@/lib/purposes";

export const MAX_BODY_IMAGES = 10;

const tiptapDoc = z
  .object({ type: z.literal("doc") })
  .passthrough()
  .nullable()
  .optional();

/**
 * 下書き保存の入力（緩い制約。公開時の必須チェックは validateForPublish で行う）。
 * 文字数制限は設けない方針のため上限は実務上十分大きい値のみ。
 */
export const releaseDraftSchema = z.object({
  titleZh: z.string().max(2000).nullable().optional(),
  subtitleZh: z.string().max(2000).nullable().optional(),
  bodyZh: tiptapDoc,
  metaDescriptionZh: z.string().max(1000).nullable().optional(),
  thumbnailUrl: z.string().max(1000).nullable().optional(),
  thumbnailCaption: z.string().max(500).nullable().optional(),
  customSlug: z
    .string()
    .max(60)
    .regex(/^[a-zA-Z0-9-]*$/)
    .optional(),
  categoryIds: z.array(z.string()).max(10).optional(),
  purpose: z.enum(PURPOSES).nullable().optional(),
  mediaOnlyInfo: z.string().max(20000).nullable().optional(),
  pressContactDept: z.string().max(200).nullable().optional(),
  pressContactName: z.string().max(200).nullable().optional(),
  pressContactEmail: z.string().max(320).nullable().optional(),
  pressContactPhone: z.string().max(60).nullable().optional(),
});

export type ReleaseDraftInput = z.infer<typeof releaseDraftSchema>;

export const submitSchema = z.object({
  scheduledAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export interface ReleaseLike {
  titleZh: string | null;
  subtitleZh: string | null;
  bodyZh: unknown;
  thumbnailUrl: string | null;
  thumbnailCaption: string | null;
  pressContactDept: string | null;
  pressContactName: string | null;
  pressContactEmail: string | null;
  pressContactPhone: string | null;
}

/** 本文画像の抽出（src で一意化） */
export function extractAllBodyImages(release: {
  bodyZh: unknown;
}): { src: string; caption: string }[] {
  const map = new Map<string, { src: string; caption: string }>();
  for (const img of collectBodyImages(release.bodyZh)) {
    if (img.src && !map.has(img.src)) map.set(img.src, img);
  }
  return [...map.values()];
}

export type PublishErrorCode =
  | "errNoContent"
  | "errThumbnail"
  | "errImageCaptions"
  | "errTooManyImages"
  | "errContact";

/**
 * 配信申請時のバリデーション。
 * - タイトル・サブタイトル・本文が揃っている
 * - サムネイル + キャプション必須
 * - 本文画像は全てキャプション必須・最大10枚
 * - 連絡先（部門・氏名・メール・電話）必須
 */
export function validateForPublish(release: ReleaseLike): PublishErrorCode[] {
  const errors: PublishErrorCode[] = [];

  const complete = !!(release.titleZh && release.subtitleZh && release.bodyZh);
  if (!complete) errors.push("errNoContent");

  if (!release.thumbnailUrl || !release.thumbnailCaption?.trim()) {
    errors.push("errThumbnail");
  }

  const images = extractAllBodyImages(release);
  if (images.some((img) => !img.caption.trim())) errors.push("errImageCaptions");
  if (images.length > MAX_BODY_IMAGES) errors.push("errTooManyImages");

  if (
    !release.pressContactDept?.trim() ||
    !release.pressContactName?.trim() ||
    !release.pressContactEmail?.trim() ||
    !release.pressContactPhone?.trim()
  ) {
    errors.push("errContact");
  }

  return errors;
}
