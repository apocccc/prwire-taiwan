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
    await seedApocAccounts();
    await seedBulkSampleData();
  }

  console.log("Seed completed.");
}

// ---------- APOC デモ用ログインアカウント ----------

const APOC_PASSWORD = "APOC1234!!";

async function seedApocAccounts() {
  const passwordHash = await bcrypt.hash(APOC_PASSWORD, 12);

  // 管理アカウント
  await prisma.user.upsert({
    where: { email: "admin@apoc.co.jp" },
    update: {},
    create: {
      email: "admin@apoc.co.jp",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      name: "APOC Admin",
      termsAcceptedAt: new Date(),
    },
  });

  // ビジネスアカウント（サンプル20社の1社目のオーナーになる。会社は seedBulkSampleData で作成）
  await prisma.user.upsert({
    where: { email: "business@apoc.co.jp" },
    update: {},
    create: {
      email: "business@apoc.co.jp",
      passwordHash,
      role: "PUBLISHER",
      status: "ACTIVE",
      name: "APOC Business",
      termsAcceptedAt: new Date(),
    },
  });

  // 記者アカウント（承認済みメディア）
  await prisma.user.upsert({
    where: { email: "editor@apoc.co.jp" },
    update: {},
    create: {
      email: "editor@apoc.co.jp",
      passwordHash,
      role: "MEDIA",
      status: "ACTIVE",
      name: "APOC Editor",
      termsAcceptedAt: new Date(),
      mediaOutlet: {
        create: {
          outletName: "APOC 新聞編輯部",
          outletUrl: "https://media.apoc.co.jp",
          contactName: "APOC Editor",
          contactEmail: "editor@apoc.co.jp",
          coverageArea: "科技、新創、企業動態",
        },
      },
    },
  });

  console.log("APOC accounts seeded (admin / business / editor @apoc.co.jp).");
}

// ---------- サンプル20社・プレスリリース40件 ----------

interface SampleCompany {
  slug: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  category: string; // 主カテゴリslug
  releases: { titleZh: string; subtitleZh: string; heading: string }[];
}

const SAMPLE_COMPANIES: SampleCompany[] = [
  {
    slug: "formosa-cloud", nameZh: "福爾摩沙雲端科技股份有限公司", nameEn: "Formosa Cloud Technologies",
    descZh: "為台灣企業提供雲端基礎設施與資安服務。", category: "technology",
    releases: [
      { titleZh: "福爾摩沙雲端推出企業級零信任資安平台", subtitleZh: "整合身分驗證與端點防護，導入僅需一週", heading: "零信任架構的三大特點" },
      { titleZh: "福爾摩沙雲端於高雄啟用第二座資料中心", subtitleZh: "南台灣企業低延遲需求一次滿足", heading: "資料中心規格" },
    ],
  },
  {
    slug: "taipei-fintech", nameZh: "台北金融科技股份有限公司", nameEn: "Taipei FinTech Inc.",
    descZh: "行動支付與數位金融解決方案供應商。", category: "finance",
    releases: [
      { titleZh: "台北金融科技行動支付用戶突破300萬", subtitleZh: "夜市小額支付成長最快，年增120%", heading: "用戶成長的關鍵" },
      { titleZh: "台北金融科技與三家銀行合作推出跨行即時轉帳", subtitleZh: "手續費全免優惠實施至年底", heading: "合作方案內容" },
    ],
  },
  {
    slug: "green-island-energy", nameZh: "綠島能源股份有限公司", nameEn: "Green Island Energy",
    descZh: "太陽能與儲能系統整合服務商。", category: "corporate",
    releases: [
      { titleZh: "綠島能源完成彰化離岸儲能示範場站", subtitleZh: "儲能容量達 120MWh，穩定綠電供應", heading: "示範場站亮點" },
      { titleZh: "綠島能源推出家用儲能訂閱方案", subtitleZh: "免初期建置費，月付即可享備援電力", heading: "訂閱方案說明" },
    ],
  },
  {
    slug: "bubble-lab", nameZh: "珍珠實驗室餐飲股份有限公司", nameEn: "Bubble Lab F&B",
    descZh: "以創新手搖飲品牌聞名的連鎖餐飲集團。", category: "food-beverage",
    releases: [
      { titleZh: "珍珠實驗室發表全台首款零糖珍珠奶茶", subtitleZh: "使用植物纖維珍珠，熱量減少45%", heading: "研發背後的故事" },
      { titleZh: "珍珠實驗室進軍日本東京展店", subtitleZh: "首店落腳澀谷，主打台灣直送茶葉", heading: "海外展店計畫" },
    ],
  },
  {
    slug: "island-travel", nameZh: "寶島旅遊科技股份有限公司", nameEn: "Island Travel Tech",
    descZh: "深度旅遊預訂平台，主打在地體驗行程。", category: "travel",
    releases: [
      { titleZh: "寶島旅遊上線離島跳島自由行方案", subtitleZh: "澎湖、蘭嶼、綠島一站式預訂", heading: "跳島方案特色" },
      { titleZh: "寶島旅遊公布2026暑假旅遊趨勢報告", subtitleZh: "山林露營搜尋量成長三倍", heading: "報告重點數據" },
    ],
  },
  {
    slug: "smart-health", nameZh: "智慧健康醫療股份有限公司", nameEn: "Smart Health Medical",
    descZh: "遠距醫療與健康管理平台。", category: "health",
    releases: [
      { titleZh: "智慧健康遠距門診服務覆蓋全台離島", subtitleZh: "與12家醫院合作，看診免舟車勞頓", heading: "服務覆蓋範圍" },
      { titleZh: "智慧健康發表 AI 健檢報告解讀助手", subtitleZh: "以白話文解釋數值，支援台語語音", heading: "AI 助手功能" },
    ],
  },
  {
    slug: "edu-next", nameZh: "明日教育科技股份有限公司", nameEn: "EduNext Taiwan",
    descZh: "K12 線上學習平台與教師工具開發商。", category: "education",
    releases: [
      { titleZh: "明日教育推出國中會考 AI 弱點診斷", subtitleZh: "十分鐘找出弱點單元，客製複習路徑", heading: "診斷功能說明" },
      { titleZh: "明日教育攜手百所偏鄉學校推數位共學", subtitleZh: "捐贈千套教材帳號，縮短城鄉差距", heading: "共學計畫內容" },
    ],
  },
  {
    slug: "night-market-retail", nameZh: "夜市嚴選零售股份有限公司", nameEn: "Night Market Select",
    descZh: "台灣特色商品電商與選物店。", category: "retail",
    releases: [
      { titleZh: "夜市嚴選開設台中旗艦店", subtitleZh: "百家在地品牌進駐，週末辦快閃市集", heading: "旗艦店亮點" },
      { titleZh: "夜市嚴選跨境電商出口額創新高", subtitleZh: "台灣零食最受東南亞買家歡迎", heading: "出口數據解析" },
    ],
  },
  {
    slug: "cinema-plus", nameZh: "加映娛樂股份有限公司", nameEn: "Cinema Plus Entertainment",
    descZh: "影視內容製作與串流發行。", category: "entertainment",
    releases: [
      { titleZh: "加映娛樂台劇《港都夜霧》全球上線", subtitleZh: "同步登上三大串流平台", heading: "作品介紹" },
      { titleZh: "加映娛樂宣布成立動畫工作室", subtitleZh: "三年內推出兩部原創動畫長片", heading: "工作室規劃" },
    ],
  },
  {
    slug: "life-style-home", nameZh: "好日子生活家居股份有限公司", nameEn: "Good Days Living",
    descZh: "居家選品與室內設計服務。", category: "lifestyle",
    releases: [
      { titleZh: "好日子發表小宅收納系統家具新系列", subtitleZh: "為15坪以下住宅量身打造", heading: "新系列特色" },
      { titleZh: "好日子舉辦老屋改造徵件計畫", subtitleZh: "免費設計改造三戶40年老屋", heading: "徵件辦法" },
    ],
  },
  {
    slug: "harbor-logistics", nameZh: "港都智慧物流股份有限公司", nameEn: "Harbor Smart Logistics",
    descZh: "冷鏈與最後一哩配送服務商。", category: "corporate",
    releases: [
      { titleZh: "港都物流啟用全自動冷鏈分揀中心", subtitleZh: "生鮮出貨效率提升60%", heading: "分揀中心規格" },
      { titleZh: "港都物流推出夜間配送服務", subtitleZh: "雙北試營運，最晚23時送達", heading: "夜配服務範圍" },
    ],
  },
  {
    slug: "ai-farm", nameZh: "田間智慧農業股份有限公司", nameEn: "AI Farm Taiwan",
    descZh: "智慧農業感測與產銷履歷平台。", category: "technology",
    releases: [
      { titleZh: "田間智慧發表果園病蟲害 AI 預警系統", subtitleZh: "提前七天預測，農藥用量減三成", heading: "預警系統原理" },
      { titleZh: "田間智慧與農會合作導入產銷履歷區塊鏈", subtitleZh: "掃碼即可追溯產地與用藥紀錄", heading: "區塊鏈履歷說明" },
    ],
  },
  {
    slug: "coffee-origin", nameZh: "源豆咖啡股份有限公司", nameEn: "Origin Bean Coffee",
    descZh: "台灣在地咖啡烘焙與訂閱服務。", category: "food-beverage",
    releases: [
      { titleZh: "源豆咖啡阿里山豆獲國際烘焙賽金獎", subtitleZh: "台灣豆首次於該賽事奪金", heading: "得獎豆風味介紹" },
      { titleZh: "源豆咖啡推出辦公室咖啡訂閱方案", subtitleZh: "每週配送現烘豆，附免費器材", heading: "訂閱方案內容" },
    ],
  },
  {
    slug: "cyber-shield", nameZh: "資盾資訊安全股份有限公司", nameEn: "CyberShield Security",
    descZh: "企業資安檢測與教育訓練。", category: "technology",
    releases: [
      { titleZh: "資盾發布2026上半年台灣資安威脅報告", subtitleZh: "釣魚簡訊攻擊量年增85%", heading: "報告重點" },
      { titleZh: "資盾推出中小企業資安健檢免費方案", subtitleZh: "限量百家，兩週完成基礎檢測", heading: "健檢方案說明" },
    ],
  },
  {
    slug: "pet-family", nameZh: "毛孩家族寵物股份有限公司", nameEn: "Pet Family Taiwan",
    descZh: "寵物鮮食與到府照護服務。", category: "lifestyle",
    releases: [
      { titleZh: "毛孩家族鮮食工廠取得雙認證", subtitleZh: "人食等級產線，全程低溫製作", heading: "認證內容" },
      { titleZh: "毛孩家族推出高齡犬貓照護服務", subtitleZh: "獸醫師到府健檢與復健指導", heading: "照護服務項目" },
    ],
  },
  {
    slug: "metro-fitness", nameZh: "都會健身科技股份有限公司", nameEn: "Metro Fitness Tech",
    descZh: "24小時智慧健身房連鎖品牌。", category: "health",
    releases: [
      { titleZh: "都會健身全台第50間門市開幕", subtitleZh: "進駐台南，會員數突破20萬", heading: "展店里程碑" },
      { titleZh: "都會健身導入 AI 動作偵測教練", subtitleZh: "即時矯正姿勢，降低運動傷害", heading: "AI 教練功能" },
    ],
  },
  {
    slug: "ocean-fresh", nameZh: "海洋直送水產股份有限公司", nameEn: "Ocean Fresh Seafood",
    descZh: "產地直送水產電商。", category: "retail",
    releases: [
      { titleZh: "海洋直送與東港漁會簽署直採合約", subtitleZh: "黑鮪魚季產地24小時到府", heading: "直採合作內容" },
      { titleZh: "海洋直送推出永續海鮮標章專區", subtitleZh: "全數通過漁源可追溯認證", heading: "永續標章說明" },
    ],
  },
  {
    slug: "game-forge", nameZh: "鍛遊互動娛樂股份有限公司", nameEn: "GameForge Interactive",
    descZh: "手機遊戲開發與發行。", category: "entertainment",
    releases: [
      { titleZh: "鍛遊新作《夜市傳說》預約突破50萬", subtitleZh: "以台灣夜市為舞台的收集養成遊戲", heading: "遊戲特色" },
      { titleZh: "鍛遊宣布進軍主機遊戲市場", subtitleZh: "首款作品預計明年公開", heading: "主機開發計畫" },
    ],
  },
  {
    slug: "silver-care", nameZh: "銀髮安心照護股份有限公司", nameEn: "Silver Care Taiwan",
    descZh: "居家照護媒合與智慧監測。", category: "health",
    releases: [
      { titleZh: "銀髮安心照護服務員媒合數破萬", subtitleZh: "平均媒合時間縮短至48小時", heading: "媒合服務數據" },
      { titleZh: "銀髮安心推出獨居長者智慧守護方案", subtitleZh: "毫米波感測跌倒，全天候通報", heading: "守護方案技術" },
    ],
  },
  {
    slug: "startup-hub", nameZh: "新創基地創投股份有限公司", nameEn: "Startup Hub Ventures",
    descZh: "早期新創投資與加速器。", category: "finance",
    releases: [
      { titleZh: "新創基地第二期加速器開放報名", subtitleZh: "聚焦 AI 與淨零題目，提供千萬種子投資", heading: "加速器計畫內容" },
      { titleZh: "新創基地發布台灣新創募資年報", subtitleZh: "早期輪募資件數回升，AI 佔四成", heading: "年報重點" },
    ],
  },
];

function bulkBody(companyName: string, heading: string, subtitle: string) {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: `${companyName}今日正式對外發布重要消息。${subtitle}。本次發布展現公司持續深耕台灣市場、回應顧客需求的決心，並將作為下一階段成長的重要里程碑。`,
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: heading }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "公司表示，團隊歷經多月籌備，從使用者研究、方案設計到內部測試皆嚴謹把關。初期回饋顯示，服務滿意度與使用意願均優於預期，未來將依據市場反應持續優化。",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "更多詳細資訊與合作洽詢，歡迎透過官方網站與客服信箱聯繫。媒體採訪需求請參閱媒體專區之聯絡方式。",
          },
        ],
      },
    ],
  };
}

async function seedBulkSampleData() {
  const passwordHash = await bcrypt.hash(APOC_PASSWORD, 12);
  const categories = await prisma.category.findMany();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  const businessUser = await prisma.user.findUnique({
    where: { email: "business@apoc.co.jp" },
    include: { company: true },
  });

  let releaseIndex = 0;
  const now = Date.now();

  for (const [ci, sc] of SAMPLE_COMPANIES.entries()) {
    // 1社目は business@apoc.co.jp が所有。他はダミーの事業者ユーザーを作成
    let userId: string;
    if (ci === 0 && businessUser) {
      userId = businessUser.id;
    } else {
      const user = await prisma.user.upsert({
        where: { email: `owner+${sc.slug}@example.com` },
        update: {},
        create: {
          email: `owner+${sc.slug}@example.com`,
          passwordHash,
          role: "PUBLISHER",
          status: "ACTIVE",
          name: sc.nameZh,
          termsAcceptedAt: new Date(),
        },
      });
      userId = user.id;
    }

    const company = await prisma.company.upsert({
      where: { slug: sc.slug },
      update: {},
      create: {
        userId,
        slug: sc.slug,
        nameZh: sc.nameZh,
        nameEn: sc.nameEn,
        descriptionZh: sc.descZh,
        websiteUrl: `https://${sc.slug}.example.tw`,
      },
    });

    for (const [ri, rel] of sc.releases.entries()) {
      releaseIndex++;
      const slug = `${sc.slug}-news-${ri + 1}`;
      // 40件中: 36件公開 / 2件審核中 / 2件草稿（business社=1社目に審核中・草稿を配置）
      const status =
        ci === 0 && ri === 0
          ? "IN_REVIEW"
          : ci === 1 && ri === 0
            ? "IN_REVIEW"
            : ci === 0 && ri === 1
              ? "DRAFT"
              : ci === 1 && ri === 1
                ? "DRAFT"
                : "PUBLISHED";
      const publishedAt =
        status === "PUBLISHED"
          ? new Date(now - releaseIndex * 16 * 60 * 60 * 1000) // 16時間刻みで過去へ
          : null;

      const release = await prisma.pressRelease.upsert({
        where: { slug },
        update: {
          thumbnailUrl: `/samples/${sc.slug}-${ri + 1}.png`,
          thumbnailCaption: `${sc.nameZh}新聞稿主視覺圖`,
        },
        create: {
          companyId: company.id,
          slug,
          status,
          titleZh: rel.titleZh,
          subtitleZh: rel.subtitleZh,
          bodyZh: bulkBody(sc.nameZh, rel.heading, rel.subtitleZh),
          // サンプル用キャンペーン画像（scripts/gen-sample-thumbnails.mjs で生成）
          thumbnailUrl: `/samples/${sc.slug}-${ri + 1}.png`,
          thumbnailCaption: `${sc.nameZh}新聞稿主視覺圖`,
          // 半数は英語版も用意（hreflang 動作確認用）
          ...(releaseIndex % 2 === 0
            ? {
                titleEn: `${sc.nameEn}: ${rel.titleZh}`,
                subtitleEn: rel.subtitleZh,
                bodyEn: bulkBody(sc.nameEn, rel.heading, rel.subtitleZh),
              }
            : {}),
          publishedAt,
          viewCount: status === "PUBLISHED" ? ((releaseIndex * 37) % 900) + 20 : 0,
        },
      });

      const cat = categoryBySlug.get(sc.category);
      if (cat) {
        await prisma.releaseCategory.upsert({
          where: {
            releaseId_categoryId: { releaseId: release.id, categoryId: cat.id },
          },
          update: {},
          create: { releaseId: release.id, categoryId: cat.id },
        });
      }

      // 3件に1件はメディア限定情報つき
      if (releaseIndex % 3 === 0) {
        await prisma.mediaOnlyInfo.upsert({
          where: { releaseId: release.id },
          update: {},
          create: {
            releaseId: release.id,
            content: `【媒體限定】${sc.nameZh} 可安排負責人專訪與產品實機展示。採訪申請請於三個工作天前提出，高解析度圖片可另行提供。`,
          },
        });
      }
    }
  }

  console.log(
    `Bulk sample data seeded: ${SAMPLE_COMPANIES.length} companies, ${releaseIndex} releases.`
  );
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
      update: {
        thumbnailUrl: `/samples/${s.slug}.png`,
        thumbnailCaption: "示範科技新聞稿主視覺圖",
      },
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
        thumbnailUrl: `/samples/${s.slug}.png`,
        thumbnailCaption: "示範科技新聞稿主視覺圖",
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
