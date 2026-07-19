-- プレスリリースの連絡先情報（メディア限定・必須）
ALTER TABLE "PressRelease" ADD COLUMN "pressContactDept" TEXT;
ALTER TABLE "PressRelease" ADD COLUMN "pressContactName" TEXT;
ALTER TABLE "PressRelease" ADD COLUMN "pressContactEmail" TEXT;
ALTER TABLE "PressRelease" ADD COLUMN "pressContactPhone" TEXT;

-- 開示請求（メディア限定情報・連絡先を閲覧請求したメディアを記録）
CREATE TABLE "DisclosureRequest" (
  "id" TEXT NOT NULL,
  "releaseId" TEXT NOT NULL,
  "mediaOutletId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DisclosureRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DisclosureRequest_releaseId_mediaOutletId_key" ON "DisclosureRequest"("releaseId", "mediaOutletId");
CREATE INDEX "DisclosureRequest_releaseId_idx" ON "DisclosureRequest"("releaseId");
ALTER TABLE "DisclosureRequest" ADD CONSTRAINT "DisclosureRequest_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "PressRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DisclosureRequest" ADD CONSTRAINT "DisclosureRequest_mediaOutletId_fkey" FOREIGN KEY ("mediaOutletId") REFERENCES "MediaOutlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
