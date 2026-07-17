import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

/**
 * サンプルリリース用のキャンペーン画像（1200x675）を生成する。
 * カテゴリ別の配色 + 企業名 + 装飾モチーフの press-release バナー風。
 * 出力: public/samples/{slug}-{n}.png （リポジトリにコミットするデモ用アセット）
 */

const OUT_DIR = path.join(process.cwd(), "public", "samples");
mkdirSync(OUT_DIR, { recursive: true });

const PALETTES = {
  technology: { from: "#1e3a8a", to: "#2563eb", accent: "#60a5fa", label: "科技" },
  finance: { from: "#065f46", to: "#0d9488", accent: "#34d399", label: "金融" },
  corporate: { from: "#334155", to: "#475569", accent: "#94a3b8", label: "企業動態" },
  "food-beverage": { from: "#9a3412", to: "#ea580c", accent: "#fdba74", label: "餐飲" },
  travel: { from: "#0e7490", to: "#0891b2", accent: "#67e8f9", label: "旅遊" },
  health: { from: "#047857", to: "#10b981", accent: "#6ee7b7", label: "健康醫療" },
  education: { from: "#1e40af", to: "#3b82f6", accent: "#93c5fd", label: "教育" },
  retail: { from: "#b91c1c", to: "#dc2626", accent: "#fca5a5", label: "零售" },
  entertainment: { from: "#6d28d9", to: "#9333ea", accent: "#d8b4fe", label: "娛樂" },
  lifestyle: { from: "#9d174d", to: "#db2777", accent: "#f9a8d4", label: "生活" },
};

// seed.ts と一致させた企業定義（slug, 企業名(zh), カテゴリ, リリース数）
const COMPANIES = [
  { slug: "demo-tech", name: "示範科技", category: "technology", releases: ["demo-ai-platform-launch", "demo-series-a-funding", "demo-carbon-neutral-2030"] },
  { slug: "formosa-cloud", name: "福爾摩沙雲端科技", category: "technology" },
  { slug: "taipei-fintech", name: "台北金融科技", category: "finance" },
  { slug: "green-island-energy", name: "綠島能源", category: "corporate" },
  { slug: "bubble-lab", name: "珍珠實驗室", category: "food-beverage" },
  { slug: "island-travel", name: "寶島旅遊科技", category: "travel" },
  { slug: "smart-health", name: "智慧健康醫療", category: "health" },
  { slug: "edu-next", name: "明日教育科技", category: "education" },
  { slug: "night-market-retail", name: "夜市嚴選零售", category: "retail" },
  { slug: "cinema-plus", name: "加映娛樂", category: "entertainment" },
  { slug: "life-style-home", name: "好日子生活家居", category: "lifestyle" },
  { slug: "harbor-logistics", name: "港都智慧物流", category: "corporate" },
  { slug: "ai-farm", name: "田間智慧農業", category: "technology" },
  { slug: "coffee-origin", name: "源豆咖啡", category: "food-beverage" },
  { slug: "cyber-shield", name: "資盾資訊安全", category: "technology" },
  { slug: "pet-family", name: "毛孩家族寵物", category: "lifestyle" },
  { slug: "metro-fitness", name: "都會健身科技", category: "health" },
  { slug: "ocean-fresh", name: "海洋直送水產", category: "retail" },
  { slug: "game-forge", name: "鍛遊互動娛樂", category: "entertainment" },
  { slug: "silver-care", name: "銀髮安心照護", category: "health" },
  { slug: "startup-hub", name: "新創基地創投", category: "finance" },
];

function template(name, category, variant) {
  const p = PALETTES[category] ?? PALETTES.corporate;
  const angle = 120 + variant * 40;
  // variant ごとにモチーフの配置を変える
  const blobs =
    variant % 2 === 0
      ? `<circle cx="1020" cy="140" r="230" fill="${p.accent}" opacity="0.18"/>
         <circle cx="1150" cy="560" r="150" fill="#ffffff" opacity="0.08"/>
         <circle cx="120" cy="600" r="120" fill="${p.accent}" opacity="0.12"/>`
      : `<rect x="880" y="-60" width="380" height="380" rx="60" fill="${p.accent}" opacity="0.16" transform="rotate(20 1050 120)"/>
         <circle cx="180" cy="120" r="130" fill="#ffffff" opacity="0.07"/>
         <circle cx="1080" cy="620" r="160" fill="${p.accent}" opacity="0.12"/>`;

  return `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:1200px; height:675px; }
  .wrap {
    width:1200px; height:675px; position:relative; overflow:hidden;
    background: linear-gradient(${angle}deg, ${p.from} 0%, ${p.to} 100%);
    font-family: "WenQuanYi Zen Hei", sans-serif; color:#fff;
  }
  svg { position:absolute; inset:0; }
  .content { position:absolute; inset:0; padding:72px 80px; display:flex; flex-direction:column; justify-content:space-between; }
  .top { display:flex; align-items:center; gap:16px; }
  .pill { display:inline-block; padding:10px 26px; border:2px solid rgba(255,255,255,0.55); border-radius:999px; font-size:30px; font-weight:700; letter-spacing:2px; }
  .kicker { font-size:24px; letter-spacing:10px; opacity:0.85; font-weight:700; }
  .name { font-size:88px; font-weight:700; line-height:1.15; max-width:820px; text-shadow:0 2px 20px rgba(0,0,0,0.25); }
  .rule { width:120px; height:8px; background:${p.accent}; border-radius:4px; margin-bottom:28px; }
  .foot { font-size:26px; opacity:0.9; letter-spacing:2px; }
</style></head>
<body>
  <div class="wrap">
    <svg viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">${blobs}</svg>
    <div class="content">
      <div class="top">
        <span class="pill">${p.label}</span>
        <span class="kicker">PRESS RELEASE</span>
      </div>
      <div>
        <div class="rule"></div>
        <div class="name">${name}</div>
      </div>
      <div class="foot">Taiwan Public Wire ・ 台灣公共新聞線</div>
    </div>
  </div>
</body></html>`;
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1200, height: 675 } });

let count = 0;
for (const c of COMPANIES) {
  const files = c.releases
    ? c.releases.map((slug, i) => ({ file: `${slug}.png`, variant: i }))
    : [0, 1].map((i) => ({ file: `${c.slug}-${i + 1}.png`, variant: i }));

  for (const { file, variant } of files) {
    await page.setContent(template(c.name, c.category, variant), { waitUntil: "load" });
    await page.screenshot({ path: path.join(OUT_DIR, file), type: "png" });
    count++;
  }
}

await browser.close();
console.log(`Generated ${count} campaign thumbnails into public/samples/`);
