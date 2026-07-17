import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

/**
 * トップページ右サイドバー用の台湾レッド・キャンペーンバナー（正方形）を生成。
 * コンセプト: 免費發布，讓消息傳遍台灣！ + 封筒から飛び出すメガホン + 台湾シルエット + ネットワーク網
 * 出力: public/banner-taiwan.jpg（JPEG圧縮）
 */
const OUT = path.join(process.cwd(), "public");
mkdirSync(OUT, { recursive: true });

// 台湾レッド
const RED_LIGHT = "#e8332b";
const RED = "#d51f1a";
const RED_DARK = "#a5120f";

// 簡略化した台湾シルエット（装飾用・低透明度）
const TAIWAN_PATH =
  "M60,8 C74,10 82,26 86,44 C90,64 92,92 84,120 C78,142 66,164 52,178 C44,186 34,190 28,182 C22,174 26,160 24,146 C22,128 14,112 12,92 C10,70 18,44 34,24 C42,14 50,6 60,8 Z";

const html = `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:1000px;height:1000px;}
  .banner{
    width:1000px;height:1000px;position:relative;overflow:hidden;
    background:radial-gradient(circle at 42% 40%, ${RED_LIGHT} 0%, ${RED} 45%, ${RED_DARK} 100%);
    font-family:"WenQuanYi Zen Hei",sans-serif;color:#fff;
  }
  svg{position:absolute;inset:0;}
  .head{position:absolute;top:78px;left:80px;right:80px;}
  .head h2{font-size:96px;font-weight:700;line-height:1.24;text-shadow:0 3px 24px rgba(0,0,0,0.28);}
</style></head>
<body>
  <div class="banner">
    <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.0"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.28"/>
        </linearGradient>
      </defs>

      <!-- 光のレイ（封筒背後から放射） -->
      <g transform="translate(500 640)" opacity="0.5">
        ${Array.from({ length: 11 })
          .map((_, i) => {
            const a = -90 + (i - 5) * 15;
            return `<polygon points="0,0 -26,-560 26,-560" fill="url(#ray)" transform="rotate(${a})"/>`;
          })
          .join("")}
      </g>

      <!-- 台湾シルエット + ネットワーク網 -->
      <g transform="translate(690 150) scale(2.4)" opacity="0.9">
        <path d="${TAIWAN_PATH}" fill="#ffffff" opacity="0.14"/>
        <g fill="#ffffff">
          <circle cx="52" cy="60" r="3.2"/><circle cx="40" cy="110" r="3.2"/>
          <circle cx="64" cy="96" r="3.2"/><circle cx="34" cy="150" r="3.2"/>
          <circle cx="58" cy="150" r="3.2"/><circle cx="46" cy="82" r="3.2"/>
        </g>
        <g stroke="#ffffff" stroke-width="1.4" opacity="0.5" fill="none">
          <path d="M52,60 L46,82 L64,96 L40,110 L58,150 L34,150"/>
          <path d="M46,82 L40,110"/>
        </g>
      </g>
      <!-- 外へ広がる拡散ライン -->
      <g stroke="#ffffff" stroke-width="2" opacity="0.35" fill="none">
        <path d="M760,470 C840,470 900,520 940,470"/>
        <path d="M760,500 C860,520 900,600 950,580"/>
        <path d="M740,520 C820,580 840,660 900,700"/>
      </g>
      <g fill="#ffffff" opacity="0.6">
        <circle cx="940" cy="470" r="5"/><circle cx="950" cy="580" r="5"/><circle cx="900" cy="700" r="5"/>
      </g>

      <!-- 封筒 -->
      <g transform="translate(500 720)">
        <!-- 封筒 本体 -->
        <path d="M-250,-40 L250,-40 L250,250 L-250,250 Z" fill="${RED_DARK}"/>
        <!-- 書類（メガホン付き） -->
        <g transform="rotate(-8)">
          <rect x="-170" y="-250" width="340" height="330" rx="14" fill="#ffffff"/>
          <rect x="-130" y="-210" width="120" height="46" rx="8" fill="#f0a6a1"/>
          <rect x="-130" y="-140" width="250" height="18" rx="9" fill="#f2c4c0"/>
          <rect x="-130" y="-104" width="250" height="18" rx="9" fill="#f2c4c0"/>
          <rect x="60" y="-60" width="60" height="18" rx="9" fill="#f2c4c0"/>
          <!-- メガホン -->
          <g transform="translate(-40 -40)">
            <path d="M-120,10 L-40,-30 L-40,60 Z" fill="${RED}"/>
            <path d="M-40,-40 L70,-70 L70,90 L-40,70 Z" fill="${RED}"/>
            <rect x="-134" y="6" width="20" height="40" rx="8" fill="${RED_DARK}"/>
            <g stroke="${RED}" stroke-width="10" stroke-linecap="round">
              <line x1="92" y1="-40" x2="128" y2="-58"/>
              <line x1="100" y1="10" x2="140" y2="10"/>
              <line x1="92" y1="60" x2="128" y2="78"/>
            </g>
          </g>
        </g>
        <!-- 封筒 前面フラップ -->
        <path d="M-250,250 L-250,10 L0,150 L250,10 L250,250 Z" fill="${RED}"/>
        <path d="M-250,-40 L0,120 L250,-40 Z" fill="${RED_LIGHT}" opacity="0.55"/>
      </g>
    </svg>

    <div class="head">
      <h2>免費發布，<br/>讓消息傳遍台灣！</h2>
    </div>
  </div>
</body></html>`;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
await page.setContent(html, { waitUntil: "load" });
await page.screenshot({
  path: path.join(OUT, "banner-taiwan.jpg"),
  type: "jpeg",
  quality: 82,
});
await browser.close();
console.log("Generated public/banner-taiwan.jpg");
