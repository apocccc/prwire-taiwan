-- レビュー運用を廃止。既定OFFに揃え、既存の IN_REVIEW を公開状態へ移行する。
UPDATE "SiteSetting" SET "reviewRequired" = false;

-- 予約日時が未来のものは予約公開、それ以外は即時公開に変換
UPDATE "PressRelease"
SET "status" = 'SCHEDULED', "publishedAt" = "scheduledAt", "reviewNote" = NULL
WHERE "status" = 'IN_REVIEW'
  AND "scheduledAt" IS NOT NULL
  AND "scheduledAt" > NOW();

UPDATE "PressRelease"
SET "status" = 'PUBLISHED', "publishedAt" = COALESCE("publishedAt", NOW()), "reviewNote" = NULL
WHERE "status" = 'IN_REVIEW';
