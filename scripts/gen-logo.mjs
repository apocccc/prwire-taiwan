import { chromium } from "playwright";
import path from "path";

/**
 * ヘッダーロゴを生成（透過PNG）。
 * 放送塔 + 赤い電波 + 赤い楕円スウッシュ(吹き出しの尾つき) + 新聞稿發布平台 / TAIWAN PUBLIC WIRE
 * 出力: public/logo.png
 */
const OUT = path.join(process.cwd(), "public", "logo.png");

const NAVY = "#123a70";
const NAVY_MID = "#2f6fb0";
const RED = "#e5301f";

const html = `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  *{margin:0;padding:0;}
  html,body{width:1500px;height:300px;}
  .wrap{width:1500px;height:300px;display:flex;align-items:center;gap:26px;
    font-family:"WenQuanYi Zen Hei",sans-serif;}
  .txt{display:flex;flex-direction:column;justify-content:center;}
  .l1{color:${NAVY};font-weight:700;font-size:118px;line-height:1;letter-spacing:6px;}
  .l2{color:${RED};font-weight:700;font-size:70px;line-height:1;letter-spacing:3px;margin-top:12px;
    font-family:Arial,Helvetica,sans-serif;}
</style></head>
<body>
  <div class="wrap">
    <svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <!-- 赤い楕円スウッシュ（オービット） -->
      <g transform="rotate(-22 150 175)">
        <ellipse cx="150" cy="175" rx="132" ry="60" fill="none" stroke="${RED}" stroke-width="22"
          stroke-linecap="round" stroke-dasharray="360 120" transform="rotate(20 150 175)"/>
      </g>
      <!-- 吹き出しの尾 -->
      <path d="M40,205 L22,250 L74,222 Z" fill="${RED}"/>

      <!-- 放送塔（下広がりの台形） -->
      <path d="M126,70 L174,70 L196,238 L104,238 Z" fill="${NAVY}"/>
      <!-- 塔のセグメント（明るい青の横帯） -->
      <g fill="${NAVY_MID}">
        <path d="M133,100 L167,100 L170,120 L130,120 Z"/>
        <path d="M128,140 L172,140 L176,162 L124,162 Z"/>
        <path d="M122,182 L178,182 L182,206 L118,206 Z"/>
      </g>
      <!-- 塔頂 -->
      <rect x="142" y="52" width="16" height="22" rx="4" fill="${NAVY}"/>

      <!-- 電波（赤い同心アーク・右上へ） -->
      <g fill="none" stroke="${RED}" stroke-width="12" stroke-linecap="round">
        <path d="M168,60 A42 42 0 0 1 210 102"/>
        <path d="M172,40 A66 66 0 0 1 238 106"/>
        <path d="M176,20 A90 90 0 0 1 266 110"/>
      </g>
    </svg>
    <div class="txt">
      <div class="l1">新聞稿發布平台</div>
      <div class="l2">TAIWAN PUBLIC WIRE</div>
    </div>
  </div>
</body></html>`;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1500, height: 300 } });
await page.setContent(html, { waitUntil: "load" });
// テキスト幅に合わせてトリミング
const box = await page.locator(".wrap").boundingBox();
await page.screenshot({
  path: OUT,
  type: "png",
  omitBackground: true,
  clip: { x: 0, y: 0, width: Math.ceil(box.width) + 10, height: 300 },
});
await browser.close();
console.log("Generated public/logo.png");
