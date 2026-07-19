-- 会社基本情報（プレスリリースと合わせて掲載）
ALTER TABLE "Company" ADD COLUMN "address" TEXT;
ALTER TABLE "Company" ADD COLUMN "representativeName" TEXT;
ALTER TABLE "Company" ADD COLUMN "capital" TEXT;
ALTER TABLE "Company" ADD COLUMN "snsX" TEXT;
ALTER TABLE "Company" ADD COLUMN "snsFacebook" TEXT;
ALTER TABLE "Company" ADD COLUMN "snsInstagram" TEXT;
ALTER TABLE "Company" ADD COLUMN "snsLine" TEXT;
ALTER TABLE "Company" ADD COLUMN "snsYoutube" TEXT;
ALTER TABLE "Company" ADD COLUMN "snsLinkedin" TEXT;

-- 登録メールアドレス変更（認証コード確認フロー）
ALTER TABLE "User" ADD COLUMN "pendingEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "emailChangeCode" TEXT;
ALTER TABLE "User" ADD COLUMN "emailChangeExpires" TIMESTAMP(3);
