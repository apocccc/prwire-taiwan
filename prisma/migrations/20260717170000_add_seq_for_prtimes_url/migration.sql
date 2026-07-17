-- URL用の連番列（PR TIMES風 {記事seq}.{会社seq}.html）。
-- SERIAL により既存行にも順次番号が採番される。
ALTER TABLE "Company" ADD COLUMN "seq" SERIAL NOT NULL;
CREATE UNIQUE INDEX "Company_seq_key" ON "Company"("seq");

ALTER TABLE "PressRelease" ADD COLUMN "seq" SERIAL NOT NULL;
CREATE UNIQUE INDEX "PressRelease_seq_key" ON "PressRelease"("seq");
