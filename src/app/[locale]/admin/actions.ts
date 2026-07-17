"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidateReleasePaths } from "@/lib/revalidate";
import { deletePrivateMediaKit } from "@/lib/storage";

/** 全管理アクション共通の認可（APIレベル検証） */
async function assertAdmin() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== "ADMIN" ||
    session.user.status !== "ACTIVE"
  ) {
    throw new Error("forbidden");
  }
  return session;
}

function revalidateAdmin() {
  for (const locale of ["zh", "en"]) {
    revalidatePath(`/${locale}/admin`, "layout");
  }
}

// ---------- 審査キュー ----------

export async function approveRelease(releaseId: string) {
  await assertAdmin();
  const release = await prisma.pressRelease.findUnique({ where: { id: releaseId } });
  if (!release || release.status !== "IN_REVIEW") return;

  if (release.scheduledAt && release.scheduledAt.getTime() > Date.now()) {
    await prisma.pressRelease.update({
      where: { id: releaseId },
      data: {
        status: "SCHEDULED",
        publishedAt: release.scheduledAt,
        reviewNote: null,
      },
    });
  } else {
    await prisma.pressRelease.update({
      where: { id: releaseId },
      data: {
        status: "PUBLISHED",
        publishedAt: release.publishedAt ?? new Date(),
        scheduledAt: null,
        reviewNote: null,
      },
    });
  }
  revalidateReleasePaths(release.slug);
  revalidateAdmin();
}

const rejectSchema = z.object({ reason: z.string().min(1).max(2000) });

export async function rejectRelease(releaseId: string, formData: FormData) {
  await assertAdmin();
  const parsed = rejectSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) return;

  await prisma.pressRelease.updateMany({
    where: { id: releaseId, status: "IN_REVIEW" },
    data: { status: "DRAFT", reviewNote: parsed.data.reason },
  });
  revalidateAdmin();
}

// ---------- リリース管理 ----------

export async function adminUnpublishRelease(releaseId: string) {
  await assertAdmin();
  const release = await prisma.pressRelease.findUnique({ where: { id: releaseId } });
  if (!release) return;
  await prisma.pressRelease.update({
    where: { id: releaseId },
    data: { status: "UNPUBLISHED", scheduledAt: null },
  });
  revalidateReleasePaths(release.slug);
  revalidateAdmin();
}

export async function adminRepublishRelease(releaseId: string) {
  await assertAdmin();
  const release = await prisma.pressRelease.findUnique({ where: { id: releaseId } });
  if (!release || release.status !== "UNPUBLISHED") return;
  await prisma.pressRelease.update({
    where: { id: releaseId },
    data: { status: "PUBLISHED", publishedAt: release.publishedAt ?? new Date() },
  });
  revalidateReleasePaths(release.slug);
  revalidateAdmin();
}

export async function adminDeleteRelease(releaseId: string) {
  await assertAdmin();
  const release = await prisma.pressRelease.findUnique({
    where: { id: releaseId },
    include: { mediaKitFiles: true },
  });
  if (!release) return;
  for (const f of release.mediaKitFiles) {
    await deletePrivateMediaKit(f.fileKey);
  }
  await prisma.pressRelease.delete({ where: { id: releaseId } });
  revalidateReleasePaths(release.slug);
  revalidateAdmin();
}

// ---------- ユーザー管理 ----------

export async function setUserStatus(
  userId: string,
  status: "ACTIVE" | "SUSPENDED"
) {
  const session = await assertAdmin();
  if (userId === session.user.id) return; // 自分自身は変更不可
  await prisma.user.updateMany({
    where: { id: userId, role: { not: "ADMIN" } },
    data: { status },
  });
  revalidateAdmin();
  // メディア一覧の公開ページにも反映
  for (const locale of ["zh", "en"]) {
    revalidatePath(`/${locale}/media`);
  }
}

// ---------- カテゴリ管理 ----------

const categorySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/),
  nameZh: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
});

export async function createCategory(formData: FormData) {
  await assertAdmin();
  const parsed = categorySchema.safeParse({
    slug: formData.get("slug"),
    nameZh: formData.get("nameZh"),
    nameEn: formData.get("nameEn"),
  });
  if (!parsed.success) return;
  const max = await prisma.category.aggregate({ _max: { sortOrder: true } });
  try {
    await prisma.category.create({
      data: { ...parsed.data, sortOrder: (max._max.sortOrder ?? 0) + 1 },
    });
  } catch {
    return; // slug重複
  }
  revalidateAdmin();
}

export async function updateCategory(categoryId: string, formData: FormData) {
  await assertAdmin();
  const parsed = categorySchema.safeParse({
    slug: formData.get("slug"),
    nameZh: formData.get("nameZh"),
    nameEn: formData.get("nameEn"),
  });
  if (!parsed.success) return;
  try {
    await prisma.category.update({ where: { id: categoryId }, data: parsed.data });
  } catch {
    return;
  }
  revalidateAdmin();
}

export async function deleteCategory(categoryId: string) {
  await assertAdmin();
  await prisma.category.delete({ where: { id: categoryId } }).catch(() => null);
  revalidateAdmin();
}

// ---------- サイト設定 ----------

const settingsSchema = z.object({
  reviewRequired: z.boolean(),
  serviceNameZh: z.string().max(100).nullable(),
  serviceNameEn: z.string().max(100).nullable(),
  footerTextZh: z.string().max(500).nullable(),
  footerTextEn: z.string().max(500).nullable(),
});

export async function updateSettings(formData: FormData) {
  await assertAdmin();
  const parsed = settingsSchema.safeParse({
    reviewRequired: formData.get("reviewRequired") === "on",
    serviceNameZh: (formData.get("serviceNameZh") as string) || null,
    serviceNameEn: (formData.get("serviceNameEn") as string) || null,
    footerTextZh: (formData.get("footerTextZh") as string) || null,
    footerTextEn: (formData.get("footerTextEn") as string) || null,
  });
  if (!parsed.success) return;
  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  });
  revalidateAdmin();
}
