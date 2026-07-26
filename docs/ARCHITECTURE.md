# Taiwan Public Wire — アーキテクチャ & 再現手順

別のメディア/新聞稿配信サイトを**同じ構成**で立ち上げるための引き継ぎ資料。
（このプロジェクト＝TPW を丸ごと雛形として使う前提）

---

## 1. 技術スタック

| 領域 | 採用 | 備考 |
|---|---|---|
| フレームワーク | **Next.js 15.5**（App Router, React 19, TypeScript） | Server Components + ISR |
| スタイル | **Tailwind CSS v4** | `@tailwindcss/postcss` |
| DB / ORM | **PostgreSQL（Supabase）+ Prisma 6** | pooler + directUrl の2本立て |
| 認証 | **Auth.js v5（next-auth beta）** Credentials + bcrypt | Supabase Auth は使わない |
| 認可 | **アプリ層**（`requireRole` / `requireApiRole`）| RLS ではなくコードで担保 |
| 国際化 | **next-intl v4**（zh-Hant 既定 + en） | `messages/*.json` |
| リッチエディタ | **Tiptap v3**（StarterKit + Underline + 自作画像ノード） | サーバー側で JSON→HTML 描画 |
| ストレージ | **Cloudflare R2（S3互換）** `@aws-sdk/client-s3` | 公開=カスタムドメイン, 非公開=認可API配信 |
| メール | **Resend** | 別ドメイン(.info)から送信 |
| ホスティング | **Vercel** | main push で自動デプロイ |
| バリデーション | **Zod v4** | |
| 画像検証 | **image-size**（寸法検証・MIME偽装対策） | |
| E2E/検証 | **Playwright** | |

Node は 22 系。パッケージ管理は npm。

---

## 2. インフラ構成（4サービス）

```
[ユーザー] ─HTTPS─> Vercel(Next.js) ──Postgres──> Supabase (DB only)
                        │
                        ├─画像(公開)──> R2 tpw-public  ── img.example.com (R2カスタムドメイン, Cloudflare Proxied)
                        ├─ファイル(非公開)> R2 tpw-private ── 認可付きAPIでストリーム配信（直リンク不可）
                        └─メール──────> Resend (.info ドメインから送信)

DNS/ドメイン：Cloudflare（ゾーン管理）
  - apex/www ── CNAME → Vercel（DNS only / グレー雲）
  - img       ── R2 カスタムドメイン（自動作成 / Proxied）
```

- **Supabase は「マネージド Postgres」としてのみ利用**。anon/service_role キー・Data API・RLS・Supabase Auth は未使用（Prisma が直接接続）。
- **R2 は Vercel の画像最適化を経由させない**（`next.config` で `unoptimized:true`＋R2ホストを `remotePatterns`）。コスト回避。
- 画像の公開URLは**絶対URL**（`https://img.example.com/uploads/xxx`）で DB 保存。将来ドメインを変える場合は相対保存に変える改善余地あり。

---

## 3. 環境変数の契約（`.env.example` 準拠）

| 変数 | 用途 | 出どころ |
|---|---|---|
| `DATABASE_URL` | アプリ実行時DB | Supabase **Transaction pooler(6543)** + `?pgbouncer=true&connection_limit=10` |
| `DIRECT_URL` | migrate用DB | Supabase **Session pooler(5432)**（pooler.supabase.com ホスト） |
| `AUTH_SECRET` | セッション署名 | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | ホスト信頼 | `true` |
| `NEXT_PUBLIC_SITE_URL` | canonical/sitemap 基準 | `https://<本番ドメイン>` |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2接続 | Cloudflare R2 API トークン |
| `R2_BUCKET_PUBLIC` | 公開バケット | 例 `xxx-public` |
| `R2_BUCKET_PRIVATE` | 非公開バケット | 例 `xxx-private` |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | 画像配信URL | `https://img.<本番ドメイン>` |
| `RESEND_API_KEY` | メール送信 | Resend |
| `EMAIL_FROM` | 送信元 | `noreply@<送信用ドメイン>` |

> **重要な地雷（Vercel×Supabase）**
> - 直結ホスト `db.<ref>.supabase.co` は **IPv6専用で Vercel から繋がらない**。必ず **pooler(`aws-0-<region>.pooler.supabase.com`)** を使う。
> - パスワードに記号があれば URL エンコード（`@`→`%40` 等）。英数字パスにリセットするのが安全。
> - `connection_limit=1` はビルド時の並列静的生成でプールタイムアウトになりやすい。**10** 程度にする。

---

## 4. DB 設計（Prisma モデル一覧）

`prisma/schema.prisma` が正。要点：

- **User**：`role`(PUBLISHER/MEDIA/ADMIN), `status`(PENDING/ACTIVE/SUSPENDED), パスワードは bcrypt。メール変更用フィールド(`pendingEmail`,`emailChangeCode`,`emailChangeExpires`)。→ `company` / `mediaOutlet` / `favorites` / `companyFollows`
- **Company**（事業者）：`seq`(URL用連番), `slug`, 多言語名/説明, `logoUrl`, `websiteUrl`, 基本情報(`address`,`representativeName`,`capital`,SNS各種)。→ `releases`, `follows`
- **MediaOutlet**（メディア）：`outletName/Url`, 担当者(`contactName/Title/Email/Phone`), `coverageArea`。→ `categoryFollows`, `disclosureRequests`
- **PressRelease**（記事）：`seq`, `status`(DRAFT/IN_REVIEW/SCHEDULED/PUBLISHED/UNPUBLISHED), 多言語(`titleZh/En`等), `bodyZh/En`(Tiptap JSON), `purpose`, サムネ, 連絡先(モザイク対象), `publishedAt`, `viewCount`。→ `images`, `categories`, `mediaOnlyInfo`, `mediaKitFiles`, `disclosureRequests`, `favorites`
- **ReleaseImage**：本文画像（`caption` 必須 = alt/figcaption）
- **Category** / **ReleaseCategory**（多対多）/ **CategoryFollow**（メディアのカテゴリ購読・週次ダイジェスト）
- **MediaOnlyInfo**：メディア限定情報（`releaseId` が主キー・1対1）
- **MediaKitFile**：メディアキット（`fileKey` は R2 の非公開キー・直リンク不可）
- **DisclosureRequest**：どのメディアがどの記事の限定情報を開示請求したか（`@@unique([releaseId, mediaOutletId])`）
- **Favorite** / **CompanyFollow**：ログインユーザー（主にメディア）の記事お気に入り・企業フォロー
- **SiteSetting**（id=1 固定）：`reviewRequired`(審査ON/OFF、既定OFF), サービス名/ロゴ/フッター上書き

URL 設計：記事は **PR TIMES 風** `/{locale}/news/{記事seq9桁}.{会社seq9桁}.html`（`src/lib/article-url.ts`）。

---

## 5. 主要な実装パターン（ファイル別）

| パターン | ファイル | ポイント |
|---|---|---|
| ストレージ抽象化 | `src/lib/storage.ts` | R2設定時はR2、未設定はローカルディスク。公開=`ContentDisposition:inline`, 非公開=認可API経由 |
| メール | `src/lib/email.ts` | `RESEND_API_KEY` 無ければ no-op（ローカルを止めない） |
| 認可（SC/API） | `src/lib/require-role.ts` / `src/lib/api-auth.ts` | ロール検証をUI出し分けに頼らず必ずAPI/SCで通す |
| クエリ集約 | `src/lib/queries.ts` | 公開条件は「いずれかの言語にタイトルあり」= 単一言語入稿でも全ロケール表示 |
| i18nフォールバック | `src/lib/l10n.ts` `pick()` | 該当言語が無ければもう一方へ |
| Tiptap描画（SSR） | `src/lib/tiptap-render.tsx` | JSON→セマンティックHTML。本文全文がHTMLに入る=SEO/AI引用対応 |
| SEO | `src/lib/seo.ts` `jsonld.tsx` `sitemap.ts` `robots.ts` `news-sitemap.xml/` | JSON-LD(NewsArticle/Org/Breadcrumb/WebSite), hreflang, Google News sitemap |
| モザイク開示 | `src/components/DisclosurePanel.tsx` + `api/releases/[id]/disclose` | 実データは公開HTMLに出さず、メディアが「開示」→記録＋API返却 |
| エディタ | `src/components/editor/*` | 2ステップ・画像は配置(左中右)/サイズ(小中大)・キャプション必須 |

**設計思想**
- 認可は**アプリ層**で一元化（`requireApiRole`）。「公開HTMLに機微データを出さない」を徹底（モザイク開示・メディアキットは認可API経由）。
- 公開ページは **ISR**（`revalidate`）で静的キャッシュ＋本文全文をHTMLに含める（SEO/AIクローラ対応）。管理系は `robots:{index:false}`。

---

## 6. デプロイ・パイプライン

- **Vercel Build Command**（プロジェクト設定で上書き）：
  `npx prisma migrate deploy && next build`
  → push 時に**本番DBへマイグレーション自動適用**してからビルド。
- `postinstall: prisma generate` で Prisma クライアント生成。
- **Production Branch = `main`**。main へ push＝自動デプロイ。
- 破壊的マイグレーションは前進のみ（自動ロールバックなし）。段階的に。
- ロールバックは Vercel の「Promote 過去デプロイ」（※DBは戻らない）。

---

## 7. 新しいメディアサイトを立ち上げる手順（このリポジトリを雛形に）

### 7-1. コード
1. このリポジトリを複製（GitHub で "Use as template" もしくは clone → 新規リポジトリへ push）。
2. ブランド差し替え：
   - `config/site.ts`（サービス名・URL・運営者情報・ロケール）
   - `public/logo.png` / `public/hero-skyline.*` / `public/banner-*.jpg` / `public/samples/*`
   - `messages/zh.json` `messages/en.json`（文言）
   - 規約/プライバシー（`src/app/[locale]/terms` `privacy` と本文データ）
3. 目的の分類やカテゴリ（`src/lib/purposes.ts`, seed のカテゴリ）を用途に合わせて調整。

### 7-2. インフラ（👤 ダッシュボード）
1. **Supabase**：新規プロジェクト（ap-northeast-1）。Security は Data API OFF 推奨。接続文字列は **pooler**（6543/5432）。
2. **Cloudflare R2**：`xxx-public` / `xxx-private` の2バケット。private は公開アクセスOFF厳守。API トークン発行。
3. **Resend**：送信用ドメイン検証（SPF/DKIM）＋ API キー。
4. **Vercel**：リポジトリ Import → Build Command 上書き → 環境変数一式設定 → Production Branch=main → Build Machine=Standard/Elastic。
5. **DNS（Cloudflare）**：本番ドメインをゾーン追加→レジストラでNS変更→Active後に
   - apex/www：Vercel 指定レコード（DNS only）
   - img：R2 カスタムドメイン接続

### 7-3. 初期化
```bash
# ローカル or Vercelビルドで
npx prisma migrate deploy   # スキーマ適用
npx prisma db seed          # 初期カテゴリ等（サンプルは本番に入れたくなければseedを調整）
```
- **管理者作成**：本番で事業者登録 → Supabase SQL Editor で
  `UPDATE "User" SET role='ADMIN' WHERE email='...';`

### 7-4. 受け入れ確認
- HTTPS 表示 / 画像が img ドメインから表示 / View Source に本文+JSON-LD / noindex は管理系のみ / sitemap が本番ドメイン / 登録・ログイン・投稿・即Published・モザイク開示。

---

## 8. 落とし穴チェックリスト（今回ハマった点）

- [ ] Supabase 接続は **pooler**（直結 `db.<ref>` は Vercel から不可）
- [ ] `connection_limit` は **10** 程度（1だとビルドで pool timeout）
- [ ] パスワードの記号は URL エンコード（または英数字化）
- [ ] Vercel の apex/www は **DNS only（グレー雲）**、img は **Proxied**
- [ ] 画像が「アップロードは成功・表示されない」= img ドメイン未接続（Phase 4待ち）
- [ ] R2 は `forcePathStyle:true`、公開画像は `ContentDisposition:inline`
- [ ] Build Command に `prisma migrate deploy` を入れる（本番スキーマ自動適用）
- [ ] Preview デプロイも本番DBを触る点に注意（スキーマ変更は main へ）
