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

  // 開発用サンプルデータ（本番では SEED_SAMPLE_DATA=false で無効化）
  if (process.env.SEED_SAMPLE_DATA !== "false") {
    await seedSampleData();
  }

  console.log("Seed completed.");
}

function sampleBody(paragraphs: string[], heading: string) {
  return {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: paragraphs[0] }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: heading }] },
      ...paragraphs.slice(1).map((p) => ({
        type: "paragraph",
        content: [{ type: "text", text: p }],
      })),
    ],
  };
}

async function seedSampleData() {
  const email = "demo-publisher@example.com";
  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      role: "PUBLISHER",
      status: "ACTIVE",
      name: "示範科技股份有限公司",
      termsAcceptedAt: new Date(),
      company: {
        create: {
          slug: "demo-tech",
          nameZh: "示範科技股份有限公司",
          nameEn: "Demo Tech Inc.",
          descriptionZh: "致力於為台灣市場提供創新軟體服務的示範企業。",
          descriptionEn: "A demo company providing innovative software services for the Taiwan market.",
          websiteUrl: "https://example.com",
        },
      },
    },
    include: { company: true },
  });
  const company =
    user.company ?? (await prisma.company.findUniqueOrThrow({ where: { userId: user.id } }));

  const tech = await prisma.category.findUnique({ where: { slug: "technology" } });

  const samples = [
    {
      slug: "demo-ai-platform-launch",
      titleZh: "示範科技發表全新 AI 客服平台，協助台灣中小企業數位轉型",
      subtitleZh: "導入生成式 AI，客服回覆效率提升三倍",
      titleEn: "Demo Tech Launches New AI Customer Service Platform for Taiwan SMEs",
      subtitleEn: "Generative AI triples customer support efficiency",
      bodyZh: sampleBody(
        [
          "示範科技股份有限公司今日宣布推出全新 AI 客服平台「DemoDesk」，專為台灣中小企業設計，協助企業以低成本導入生成式 AI 客服。",
          "DemoDesk 支援繁體中文與台語語音辨識，可自動分類客戶問題並產生建議回覆，客服人員平均處理時間縮短 65%。",
          "該平台即日起開放免費試用 30 天，詳情請參閱官方網站。",
        ],
        "三倍效率的秘密"
      ),
      bodyEn: sampleBody(
        [
          "Demo Tech Inc. today announced DemoDesk, a new AI customer service platform designed for small and medium-sized businesses in Taiwan.",
          "DemoDesk supports Traditional Chinese and Taiwanese speech recognition, automatically categorizes customer inquiries, and generates suggested replies, reducing average handling time by 65%.",
          "A 30-day free trial is available starting today.",
        ],
        "How the 3x efficiency works"
      ),
      daysAgo: 0,
    },
    {
      slug: "demo-series-a-funding",
      titleZh: "示範科技完成 A 輪融資，募得新台幣 3 億元",
      subtitleZh: "資金將用於擴大工程團隊與東南亞市場布局",
      titleEn: null,
      subtitleEn: null,
      bodyZh: sampleBody(
        [
          "示範科技今日宣布完成 A 輪融資，由知名創投領投，募資金額達新台幣 3 億元。",
          "本輪資金將主要用於擴編工程團隊、強化產品研發，並啟動東南亞市場布局。",
        ],
        "資金用途"
      ),
      bodyEn: null,
      daysAgo: 1,
    },
    {
      slug: "demo-carbon-neutral-2030",
      titleZh: "示範科技承諾 2030 年達成碳中和目標",
      subtitleZh: "全面轉用再生能源，並公開年度永續報告書",
      titleEn: "Demo Tech Commits to Carbon Neutrality by 2030",
      subtitleEn: "Full transition to renewable energy with annual sustainability reports",
      bodyZh: sampleBody(
        [
          "示範科技今日發布首份永續報告書，並承諾於 2030 年前達成營運碳中和。",
          "公司將分階段轉用再生能源，包括資料中心綠電採購與辦公室節能改造。",
        ],
        "減碳路徑圖"
      ),
      bodyEn: sampleBody(
        [
          "Demo Tech released its first sustainability report today, committing to carbon-neutral operations by 2030.",
          "The company will transition to renewable energy in phases, including green power procurement for data centers.",
        ],
        "The roadmap to net zero"
      ),
      daysAgo: 3,
    },
  ];

  for (const s of samples) {
    const publishedAt = new Date(Date.now() - s.daysAgo * 24 * 60 * 60 * 1000);
    const release = await prisma.pressRelease.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        companyId: company.id,
        slug: s.slug,
        status: "PUBLISHED",
        titleZh: s.titleZh,
        subtitleZh: s.subtitleZh,
        bodyZh: s.bodyZh ?? undefined,
        titleEn: s.titleEn,
        subtitleEn: s.subtitleEn,
        bodyEn: s.bodyEn ?? undefined,
        publishedAt,
      },
    });
    if (tech) {
      await prisma.releaseCategory.upsert({
        where: {
          releaseId_categoryId: { releaseId: release.id, categoryId: tech.id },
        },
        update: {},
        create: { releaseId: release.id, categoryId: tech.id },
      });
    }
    // メディア限定情報のサンプル
    await prisma.mediaOnlyInfo.upsert({
      where: { releaseId: release.id },
      update: {},
      create: {
        releaseId: release.id,
        content:
          "【メディア限定】取材のお申し込みは広報担当まで。代表インタビュー・製品デモのアレンジが可能です。",
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
