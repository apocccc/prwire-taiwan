# twpr — 台湾ローカル向けプレスリリース配信メディア（仮称）

誰でも**無料**で台湾向けにプレスリリースを配信できるサービス。配信されたリリースは公開メディアとして掲載され、Google への強いインデックスを最重要目標とする。

サービス名は未定のため、コード上は仮称 `twpr` を使用。サービス名・ドメイン・ロゴは **`config/site.ts`** に集約されており、正式決定後はこのファイル（+管理画面のサイト設定）の変更のみで全体に反映される。

## 技術スタック

- Next.js 15（App Router）+ TypeScript — 公開ページは SSG/ISR でサーバーサイド HTML 生成
- PostgreSQL + Prisma 6（Supabase / Neon 想定）
- Auth.js v5（メール+パスワード、ロールベース: PUBLISHER / MEDIA / ADMIN）
- next-intl（繁体字 `zh-Hant` デフォルト / 英語 `en`、`/{locale}/...` URL）
- Tiptap v3 リッチエディター（見出し・太字・リンク・引用・リスト・画像・表）
- Tailwind CSS v4

## セットアップ

```bash
npm install
cp .env.example .env   # DATABASE_URL / AUTH_SECRET を設定
npx prisma migrate dev # スキーマ適用
npx prisma db seed     # 管理者・カテゴリ・サンプルリリース投入
npm run dev
```

- `AUTH_SECRET` は `npx auth secret` または `openssl rand -base64 32` で生成
- シード管理者: `.env` の `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`（既定 `admin@example.com` / `admin-change-me`）
- サンプルデータを入れない場合は `SEED_SAMPLE_DATA=false npx prisma db seed`

## 主要機能

### 公開側（SEO 最優先）
- 全公開ページを ISR で静的 HTML 化（View Source でタイトル・本文全文が見える）
- セマンティック HTML（`article` / 1ページ1つの `h1` / `h2` / `time datetime` / `figure`+`figcaption`）
- JSON-LD: `NewsArticle`（記事）/ `Organization`（企業）/ `BreadcrumbList`（全ページ）/ `WebSite`+`SearchAction`（トップ）
- canonical / hreflang（zh-Hant・en・x-default、言語版が存在する場合のみ相互リンク）/ OGP・Twitter カード
- `sitemap.xml` + **Google News sitemap**（直近48時間）+ `robots.txt`（管理系ブロック）
- ページネーションは `/page/2` 形式の HTML リンク
- 画像は `next/image`（WebP・遅延読込・width/height 指定で CLS 防止、LCP 画像は priority）
- Asia/Taipei 基準の日時表示、PV 計測ビーコン

### 事業者（Publisher）
- Tiptap リッチエディター（zh-Hant / en 両言語、片方のみでも公開可）
- サムネイル必須+キャプション必須、本文画像は最大10枚・**全てキャプション必須**（未入力は保存もブロック。キャプションは alt と figcaption の両方に出力）
- 配信前設定: カテゴリ複数選択 / メディア限定情報 / メディアキット（zip・pdf・画像）
- フロー: 下書き保存 → プレビュー → 配信申請 → 管理者審査 → 公開/予約公開（審査は管理画面で ON/OFF 可）
- ダッシュボード: 状態別一覧・PV・編集・複製・非公開化

### メディア（Media）
- 登録は管理者承認制（承認まではログイン不可）
- メディア専区: メディア限定情報の閲覧、メディアキットのダウンロード（**認可付き API 経由のみ・直リンク不可**）、カテゴリフォロー
- 公開メディア一覧ページ（媒体名・URL・カバー領域のみ。個別連絡先は非公開）
- 週次ダイジェスト: `npm run digest:weekly`（集計まで実装済み、メール送信はプロバイダー接続時に `sendDigest()` を差し替え）

### 管理者（Admin）
- 審査キュー（承認 / 差し戻し+理由）、リリース管理（非公開化・再公開・削除）
- ユーザー管理（事業者・メディアの承認/停止）、カテゴリマスタ管理（zh/en 名称+slug）
- サイト設定（サービス名・フッター文言の上書き、審査フロー ON/OFF）、記事別 PV

## ディレクトリ構成

```
config/site.ts            # サービス名・ドメイン・ロゴ・ロケール設定の一元管理
prisma/                   # スキーマ・マイグレーション・シード
messages/{zh,en}.json     # i18n辞書
scripts/weekly-digest.ts  # 週次ダイジェスト集計
src/
  auth.ts / auth.config.ts / middleware.ts   # 認証・i18nルーティング・ロール認可
  i18n/                   # next-intl 設定
  lib/
    seo.ts / jsonld.tsx   # メタ生成・構造化データ
    tiptap-render.tsx     # Tiptap JSON→セマンティックHTML（サーバーレンダリング）
    queries.ts            # 公開側クエリ（ISR用）
    storage.ts            # ストレージ抽象化（v1: ローカル。S3互換へ差し替え可能）
    api-auth.ts / require-role.ts / validation/  # APIレベルのロール検証・zod
  components/             # 公開UI・エディター・ダッシュボード部品
  app/
    [locale]/             # 公開: トップ/news/category/company/media/search/terms
      dashboard/          # 事業者（エディター・プレビュー含む）
      admin/              # 管理（審査/リリース/ユーザー/カテゴリ/設定/分析）
      media-room/         # メディア専区
    api/                  # 認証・登録・リリースCRUD・アップロード・メディアキット
    sitemap.ts / robots.ts / news-sitemap.xml/   # SEO出力
```

## 動作確認手順

1. **公開側**: `http://localhost:3000/zh` → トップに最新リリース。記事ページで View Source し `<h1>`・本文・JSON-LD・hreflang を確認。`/sitemap.xml` `/news-sitemap.xml` `/robots.txt` も確認
2. **事業者**: `/zh/register/publisher` で登録（規約同意4項目必須）→ ログイン → ダッシュボードで「建立新聞稿」→ エディターで作成（画像挿入時キャプション必須）→ 配信申請 → 状態が「審核中」になる
3. **管理者**: シード管理者でログイン → `/zh/admin` 審査キューで承認 → 記事が公開側に即時反映。ユーザー管理でメディア申請を承認
4. **メディア**: `/zh/register/media` で登録 → 管理者承認後ログイン → `/zh/media-room` で限定情報閲覧・キットDL・カテゴリフォロー
5. **規約**: `/zh/terms`（事例利用許諾・メディア一覧公開・ダイレクト送付の3条項を含む雛形）

## 本番移行時の TODO

- 画像・メディアキットのストレージを S3 互換へ差し替え（`src/lib/storage.ts`）
- 週次ダイジェストのメール送信実装（`scripts/weekly-digest.ts` の `sendDigest()`）+ cron 設定
- `config/site.ts` の正式サービス名・ドメイン・ロゴ差し替え、OGPデフォルト画像の刷新
- 利用規約の法務レビュー（`src/app/[locale]/terms/page.tsx`）
- `next.config.ts` の `images.remotePatterns` に本番ストレージドメインを追加

## 開発フェーズ（全完了）

- [x] **Phase 1**: セットアップ、Prisma スキーマ、認証+ロール、サイト設定一元化
- [x] **Phase 2**: SEO 基盤（メタ/JSON-LD/sitemap/hreflang）+ 公開ページ
- [x] **Phase 3**: 事業者機能（Tiptap、画像+キャプション必須、配信フロー）
- [x] **Phase 4**: 管理画面（審査キュー、ユーザー管理、カテゴリ管理、設定、分析）
- [x] **Phase 5**: メディア機能（承認制、限定情報・メディアキットのアクセス制御、フォロー）
- [x] **Phase 6**: 利用規約+同意フロー、OGP、Google News sitemap、PV カウント
