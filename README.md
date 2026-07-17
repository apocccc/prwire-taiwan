# twpr — 台湾ローカル向けプレスリリース配信メディア（仮称）

誰でも無料で台湾向けにプレスリリースを配信できるサービス。配信されたリリースは公開メディアとして掲載され、Google への強いインデックスを最重要目標とする。

サービス名は未定のため、コード上は仮称 `twpr` を使用。サービス名・ドメイン・ロゴは **`config/site.ts`** に集約されており、正式決定後はこのファイルの変更のみで全体に反映される。

## 技術スタック

- Next.js 15（App Router）+ TypeScript — 公開ページは SSG/ISR でサーバーサイド HTML 生成
- PostgreSQL + Prisma 6（Supabase / Neon 想定）
- Auth.js v5（メール+パスワード、ロールベース: PUBLISHER / MEDIA / ADMIN）
- next-intl（繁体字 `zh-Hant` デフォルト / 英語 `en`）
- Tailwind CSS v4
- Tiptap リッチエディター（Phase 3 で導入）

## セットアップ

```bash
npm install
cp .env.example .env   # DATABASE_URL / AUTH_SECRET を設定
npx prisma migrate dev # スキーマ適用
npx prisma db seed     # 管理者・カテゴリ・サイト設定の初期データ
npm run dev
```

`AUTH_SECRET` は `npx auth secret` または `openssl rand -base64 32` で生成。

## ディレクトリ構成

```
config/site.ts            # サービス名・ドメイン・ロゴ・ロケール設定の一元管理
prisma/schema.prisma      # データモデル（User/Company/MediaOutlet/PressRelease 等）
prisma/seed.ts            # 初期データ（管理者・カテゴリ10種・サイト設定）
messages/{zh,en}.json     # i18n 辞書
src/
  auth.ts                 # Auth.js 本体設定（Credentials + Prisma）
  auth.config.ts          # Edge 互換設定（middleware 用）
  middleware.ts           # next-intl ルーティング + ロールベース認可
  i18n/                   # next-intl routing / request / navigation
  lib/
    prisma.ts             # PrismaClient シングルトン
    password.ts           # bcrypt ハッシュ
    require-role.ts       # サーバー側ロール検証（二重チェック）
    validation/register.ts# 登録バリデーション（zod、同意チェック必須）
  app/
    [locale]/             # 公開ページ（zh: 繁体字デフォルト / en）
      page.tsx            # トップ
      login/              # ログイン
      register/publisher/ # 事業者登録（即時 ACTIVE）
      register/media/     # メディア登録（管理者承認制 PENDING）
      dashboard/          # 事業者ダッシュボード（PUBLISHER/ADMIN）
      admin/              # 管理画面（ADMIN）
      media-room/         # メディア専区（MEDIA/ADMIN）
    api/auth/[...nextauth]/ # Auth.js ハンドラー
    api/register/         # 登録 API（同意チェック・重複検証）
```

## Phase 1 動作確認手順

1. `npm run dev` で起動し `http://localhost:3000/zh` を開く（`/` は `/zh` へリダイレクト）
2. `/zh/register/publisher` で事業者登録（同意チェック4項目すべて必須）→ 登録後すぐログイン可
3. `/zh/register/media` でメディア登録 → PENDING のためログイン不可（管理者承認待ち）
4. `/zh/login` でログイン:
   - 事業者 → `/zh/dashboard` にアクセス可、`/zh/admin` は拒否
   - シード管理者（`.env` の `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`）→ `/zh/admin` にアクセス可
5. 未ログインで `/zh/dashboard` へ → `/zh/login?callbackUrl=...` にリダイレクト
6. View Source で `<h1>` と本文がサーバー生成 HTML に含まれることを確認（SEO 基盤）

## 開発フェーズ

- [x] **Phase 1**: セットアップ、Prisma スキーマ、認証+ロール、サイト設定一元化
- [ ] **Phase 2**: SEO 基盤(メタ/JSON-LD/sitemap/hreflang) + 公開ページ(記事/カテゴリ/企業/メディア一覧)
- [ ] **Phase 3**: 事業者機能（Tiptap、画像+キャプション必須、配信フロー）
- [ ] **Phase 4**: 管理画面（審査キュー、ユーザー管理、カテゴリ管理）
- [ ] **Phase 5**: メディア機能（承認制、限定情報・メディアキットのアクセス制御）
- [ ] **Phase 6**: 利用規約+同意フロー、OGP 自動生成、Google News sitemap、PV カウント
