import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Locale } from "../../config/site";

export const PER_PAGE = 12;

/** 指定ロケール版が存在する公開済みリリースの where 条件 */
function publishedWhere(locale: Locale): Prisma.PressReleaseWhereInput {
  return {
    status: "PUBLISHED",
    publishedAt: { lte: new Date() },
    ...(locale === "zh" ? { titleZh: { not: null } } : { titleEn: { not: null } }),
  };
}

const listSelect = {
  id: true,
  slug: true,
  titleZh: true,
  titleEn: true,
  subtitleZh: true,
  subtitleEn: true,
  thumbnailUrl: true,
  thumbnailCaption: true,
  publishedAt: true,
  company: { select: { slug: true, nameZh: true, nameEn: true } },
  categories: {
    select: { category: { select: { slug: true, nameZh: true, nameEn: true } } },
  },
} satisfies Prisma.PressReleaseSelect;

export type ReleaseListItem = Prisma.PressReleaseGetPayload<{
  select: typeof listSelect;
}>;

export async function getLatestReleases(locale: Locale, page = 1) {
  const where = publishedWhere(locale);
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

export async function getReleaseBySlug(slug: string) {
  return prisma.pressRelease.findUnique({
    where: { slug },
    include: {
      company: true,
      images: { orderBy: { sortOrder: "asc" } },
      categories: { include: { category: true } },
    },
  });
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function getReleasesByCategory(
  categoryId: string,
  locale: Locale,
  page = 1
) {
  const where: Prisma.PressReleaseWhereInput = {
    ...publishedWhere(locale),
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

export async function getReleasesByCompany(
  companyId: string,
  locale: Locale,
  page = 1
) {
  const where: Prisma.PressReleaseWhereInput = {
    ...publishedWhere(locale),
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
    ...publishedWhere(locale),
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
      status: "PUBLISHED",
      publishedAt: { gte: cutoff, lte: new Date() },
    },
    select: {
      slug: true,
      titleZh: true,
      titleEn: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 1000,
  });
}

/** 通常サイトマップ用の全公開コンテンツ */
export async function getAllPublishedForSitemap() {
  const [releases, categories, companies] = await Promise.all([
    prisma.pressRelease.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      select: {
        slug: true,
        titleZh: true,
        titleEn: true,
        updatedAt: true,
        publishedAt: true,
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
