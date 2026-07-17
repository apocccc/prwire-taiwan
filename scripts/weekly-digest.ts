/**
 * 週次ダイジェスト生成スクリプト（v1）。
 * フォロー中カテゴリの直近7日間の新着リリースをメディアごとに集計する。
 *
 * 実行: npx tsx scripts/weekly-digest.ts （cron等で週1回実行を想定）
 *
 * NOTE: v1 ではメール送信基盤（Resend / SES 等）が未接続のため、
 * 送信内容を標準出力に書き出す。送信処理は sendDigest() を差し替えて実装する。
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

interface DigestItem {
  title: string;
  url: string;
  companyName: string;
  publishedAt: Date;
}

async function sendDigest(to: string, outletName: string, items: DigestItem[]) {
  // TODO: メールプロバイダー接続後にここを実装する
  console.log(`\n=== Digest for ${outletName} <${to}> (${items.length} items) ===`);
  for (const item of items) {
    console.log(`- ${item.title}\n  ${item.companyName} / ${item.publishedAt.toISOString()}\n  ${item.url}`);
  }
}

async function main() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const outlets = await prisma.mediaOutlet.findMany({
    where: {
      user: { status: "ACTIVE" },
      categoryFollows: { some: {} },
    },
    include: { categoryFollows: { select: { categoryId: true } } },
  });

  console.log(`Outlets with follows: ${outlets.length}`);

  for (const outlet of outlets) {
    const categoryIds = outlet.categoryFollows.map((f) => f.categoryId);
    const releases = await prisma.pressRelease.findMany({
      where: {
        status: { in: ["PUBLISHED", "SCHEDULED"] },
        publishedAt: { gte: since, lte: new Date() },
        categories: { some: { categoryId: { in: categoryIds } } },
      },
      select: {
        slug: true,
        titleZh: true,
        titleEn: true,
        publishedAt: true,
        company: { select: { nameZh: true, nameEn: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });

    if (releases.length === 0) continue;

    await sendDigest(
      outlet.contactEmail,
      outlet.outletName,
      releases.map((r) => ({
        title: r.titleZh ?? r.titleEn ?? "",
        url: `${SITE_URL}/zh/news/${r.slug}`,
        companyName: r.company.nameZh ?? r.company.nameEn ?? "",
        publishedAt: r.publishedAt!,
      }))
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
