/**
 * 初期データ投入
 * 実行: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 管理者アカウント
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin-change-me";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      name: "Admin",
      termsAcceptedAt: new Date(),
    },
  });

  // カテゴリマスタ（zh-Hant / en）
  const categories: { slug: string; nameZh: string; nameEn: string }[] = [
    { slug: "technology", nameZh: "科技", nameEn: "Technology" },
    { slug: "finance", nameZh: "金融", nameEn: "Finance" },
    { slug: "lifestyle", nameZh: "生活", nameEn: "Lifestyle" },
    { slug: "food-beverage", nameZh: "餐飲", nameEn: "Food & Beverage" },
    { slug: "travel", nameZh: "旅遊", nameEn: "Travel" },
    { slug: "entertainment", nameZh: "娛樂", nameEn: "Entertainment" },
    { slug: "health", nameZh: "健康醫療", nameEn: "Health & Medical" },
    { slug: "education", nameZh: "教育", nameEn: "Education" },
    { slug: "retail", nameZh: "零售", nameEn: "Retail" },
    { slug: "corporate", nameZh: "企業動態", nameEn: "Corporate" },
  ];

  for (const [i, c] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { nameZh: c.nameZh, nameEn: c.nameEn, sortOrder: i },
      create: { ...c, sortOrder: i },
    });
  }

  // サイト設定（1行のみ）
  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, reviewRequired: true },
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
