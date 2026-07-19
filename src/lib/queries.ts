import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Locale } from "../../config/site";

export const PER_PAGE = 12;

/**
 * 公開済みリリースの where 条件。
 * 入稿は単一言語（既定は繁体中文）のため、いずれかの言語のタイトルがあれば
 * 全ロケールの一覧に表示し、表示側は pick() で存在する言語にフォールバックする。
 */
function publishedWhere(): Prisma.PressReleaseWhereInput {
  return {
    // SCHEDULED は公開時刻を過ぎた時点で公開扱い（ISR再生成時に反映）
    status: { in: ["PUBLISHED", "SCHEDULED"] },
    publishedAt: { lte: new Date() },
    OR: [{ titleZh: { not: null } }, { titleEn: { not: null } }],
  };
}

const listSelect = {
  id: true,
  seq: true,
  slug: true,
  titleZh: true,
  titleEn: true,
  subtitleZh: true,
  subtitleEn: true,
  thumbnailUrl: true,
  thumbnailCaption: true,
  publishedAt: true,
  viewCount: true,
  company: { select: { seq: true, slug: true, nameZh: true, nameEn: true } },
  categories: {
    select: { category: { select: { slug: true, nameZh: true, nameEn: true } } },
  },
} satisfies Prisma.PressReleaseSelect;

export type ReleaseListItem = Prisma.PressReleaseGetPayload<{
  select: typeof listSelect;
}>;

export async function getLatestReleases(page = 1) {
  const where = publishedWhere();
  const [items, total] = await Promise.all([
    prisma.pressRelease.findMany({
      where,
      select: listSelect,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.pressRelease.count({ where }),
  ]);
  return { items, total, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) };
}

/**
 * PVランキング（システム内の viewCount 基準）。
 * period: "all"=全期間 / "month"=直近30日公開 / "week"=直近7日公開 の中でPV降順。
 */
export async function getTopByViews(
  limit = 6,
  period: "all" | "month" | "week" = "all"
) {
  const where: Prisma.PressReleaseWhereInput = { ...publishedWhere() };
  if (period !== "all") {
    const days = period === "week" ? 7 : 30;
    where.publishedAt = {
      lte: new Date(),
      gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
    };
  }
  return prisma.pressRelease.findMany({
    where,
    select: listSelect,
    orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });
}

export async function getReleaseBySlug(slug: string) {
  return prisma.pressRelease.findUnique({
    where: { slug },
    include: {
      company: true,
      images: { orderBy: { sortOrder: "asc" } },
      categories: { include: { category: true } },
      mediaOnlyInfo: { select: { releaseId: true } },
      _count: { select: { mediaKitFiles: true } },
    },
  });
}

/** PR TIMES風URL（記事seq.会社seq）からの記事取得 */
export async function getReleaseBySeqs(releaseSeq: number, companySeq: number) {
  const release = await prisma.pressRelease.findUnique({
    where: { seq: releaseSeq },
    include: {
      company: true,
      images: { orderBy: { sortOrder: "asc" } },
      categories: { include: { category: true } },
      mediaOnlyInfo: { select: { releaseId: true } },
      _count: { select: { mediaKitFiles: true } },
    },
  });
  // 会社seqが一致しない場合は不正なURLとして扱う
  if (!release || release.company.seq !== companySeq) return null;
  return release;
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function getReleasesByCategory(categoryId: string, page = 1) {
  const where: Prisma.PressReleaseWhereInput = {
    ...publishedWhere(),
    categories: { some: { categoryId } },
  };
  const [items, total] = await Promise.all([
    prisma.pressRelease.findMany({
      where,
      select: listSelect,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.pressRelease.count({ where }),
  ]);
  return { items, total, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) };
}

export async function getCompanyBySlug(slug: string) {
  return prisma.company.findUnique({ where: { slug } });
}

export async function getReleasesByCompany(companyId: string, page = 1) {
  const where: Prisma.PressReleaseWhereInput = {
    ...publishedWhere(),
    companyId,
  };
  const [items, total] = await Promise.all([
    prisma.pressRelease.findMany({
      where,
      select: listSelect,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.pressRelease.count({ where }),
  ]);
  return { items, total, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) };
}

/** 公開メディア一覧（承認済みのみ。個別連絡先は選択しない） */
export async function getPublicMediaOutlets() {
  return prisma.mediaOutlet.findMany({
    where: { user: { status: "ACTIVE" } },
    select: {
      id: true,
      outletName: true,
      outletUrl: true,
      coverageArea: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function searchReleases(q: string, locale: Locale, page = 1) {
  const where: Prisma.PressReleaseWhereInput = {
    ...publishedWhere(),
    OR:
      locale === "zh"
        ? [
            { titleZh: { contains: q, mode: "insensitive" } },
            { subtitleZh: { contains: q, mode: "insensitive" } },
          ]
        : [
            { titleEn: { contains: q, mode: "insensitive" } },
            { subtitleEn: { contains: q, mode: "insensitive" } },
          ],
  };
  const [items, total] = await Promise.all([
    prisma.pressRelease.findMany({
      where,
      select: listSelect,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.pressRelease.count({ where }),
  ]);
  return { items, total, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) };
}

/** Google News sitemap 用: 直近48時間の公開リリース */
export async function getRecentReleasesForNewsSitemap() {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  return prisma.pressRelease.findMany({
    where: {
      status: { in: ["PUBLISHED", "SCHEDULED"] },
      publishedAt: { gte: cutoff, lte: new Date() },
    },
    select: {
      seq: true,
      slug: true,
      titleZh: true,
      titleEn: true,
      publishedAt: true,
      company: { select: { seq: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 1000,
  });
}

/** 通常サイトマップ用の全公開コンテンツ */
export async function getAllPublishedForSitemap() {
  const [releases, categories, companies] = await Promise.all([
    prisma.pressRelease.findMany({
      where: {
        status: { in: ["PUBLISHED", "SCHEDULED"] },
        publishedAt: { lte: new Date() },
      },
      select: {
        seq: true,
        slug: true,
        titleZh: true,
        titleEn: true,
        updatedAt: true,
        publishedAt: true,
        company: { select: { seq: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 5000,
    }),
    prisma.category.findMany({ select: { slug: true } }),
    prisma.company.findMany({
      select: { slug: true, updatedAt: true },
      where: { releases: { some: { status: "PUBLISHED" } } },
    }),
  ]);
  return { releases, categories, companies };
}
