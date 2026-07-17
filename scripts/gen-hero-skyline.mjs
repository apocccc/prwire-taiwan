import { chromium } from "playwright";
import path from "path";

/**
 * トップのヒーロー背景（台北スカイライン、淡いブルー、左に向けてフェード）を生成。
 * 出力: public/hero-skyline.png（透過PNG）
 */
const OUT = path.join(process.cwd(), "public", "hero-skyline.png");
const W = 2200;
const H = 620;

// 疑似ランダムなビル群を生成
function buildings(count, baseY, colorFrom, colorTo, minH, maxH, wMin, wMax) {
  let x = 0;
  const rects = [];
  let i = 0;
  while (x < W) {
    const w = wMin + ((i * 37) % (wMax - wMin));
    const h = minH + ((i * 53) % (maxH - minH));
    const shade = i % 2 === 0 ? colorFrom : colorTo;
    rects.push(
      `<rect x="${x}" y="${baseY - h}" width="${w - 4}" height="${h}" fill="${shade}"/>`
    );
    // 窓っぽい横線
    x += w;
    i++;
  }
  return rects.join("");
}

// 台北101（テーパーした8段 + スパイア）
function taipei101(cx, baseY) {
  const segH = 42;
  const segs = [];
  for (let i = 0; i < 8; i++) {
    const y = baseY - 90 - (i + 1) * segH;
    const wBottom = 66 - i * 1.5;
    const wTop = wBottom + 12; // 上に向けて広がる
    const xb = cx - wBottom / 2;
    const xt = cx - wTop / 2;
    segs.push(
      `<path d="M${xb},${y + segH} L${xb + wBottom},${y + segH} L${xt + wTop},${y} L${xt},${y} Z" fill="#6f97c8"/>`
    );
  }
  const topY = baseY - 90 - 8 * segH;
  return `
    <rect x="${cx - 50}" y="${baseY - 90}" width="100" height="90" fill="#5f89bd"/>
    ${segs.join("")}
    <rect x="${cx - 8}" y="${topY - 70}" width="16" height="70" fill="#6f97c8"/>
    <rect x="${cx - 3}" y="${topY - 120}" width="6" height="50" fill="#6f97c8"/>`;
}

const html = `<!doctype html><html><head><meta charset="utf-8"/></head>
<body style="margin:0">
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#fff" stop-opacity="1"/>
        <stop offset="42%" stop-color="#fff" stop-opacity="0"/>
        <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <mask id="leftfade">
        <rect width="${W}" height="${H}" fill="#fff"/>
        <rect width="${W}" height="${H}" fill="url(#fade)"/>
      </mask>
    </defs>

    <g mask="url(#leftfade)">
      <!-- 遠景の山（非常に淡い） -->
      <path d="M0,${H} L0,430 Q400,360 820,415 T1500,400 T${W},420 L${W},${H} Z" fill="#dbe7f5"/>
      <path d="M0,${H} L0,470 Q500,410 1000,455 T${W},460 L${W},${H} Z" fill="#cddcf0"/>

      <!-- 後列ビル -->
      ${buildings(0, 560, "#b9cfe8", "#adc6e3", 70, 210, 60, 120)}
      <!-- 台北101 -->
      ${taipei101(1360, 560)}
      <!-- 前列ビル -->
      ${buildings(0, 560, "#a7c1e0", "#9bb7da", 40, 150, 44, 96)}
      <!-- 地面フェード -->
      <rect x="0" y="500" width="${W}" height="120" fill="url(#ground)"/>
      <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fff" stop-opacity="0"/>
        <stop offset="100%" stop-color="#fff" stop-opacity="0.9"/>
      </linearGradient>
    </g>
  </svg>
</body></html>`;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(html, { waitUntil: "load" });
await page.screenshot({ path: OUT, type: "png", omitBackground: true });
await browser.close();
console.log("Generated public/hero-skyline.png");
