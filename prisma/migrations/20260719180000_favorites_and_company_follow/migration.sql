-- お気に入り記事
CREATE TABLE "Favorite" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "releaseId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Favorite_userId_releaseId_key" ON "Favorite"("userId", "releaseId");
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "PressRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 企業フォロー
CREATE TABLE "CompanyFollow" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompanyFollow_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CompanyFollow_userId_companyId_key" ON "CompanyFollow"("userId", "companyId");
CREATE INDEX "CompanyFollow_userId_idx" ON "CompanyFollow"("userId");
ALTER TABLE "CompanyFollow" ADD CONSTRAINT "CompanyFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyFollow" ADD CONSTRAINT "CompanyFollow_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
