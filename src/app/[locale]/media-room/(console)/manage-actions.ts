"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new Error("forbidden");
  }
  return session.user.id;
}

/** お気に入りから外す */
export async function removeFavorite(releaseId: string) {
  const userId = await requireUser();
  await prisma.favorite.deleteMany({ where: { userId, releaseId } });
  for (const locale of ["zh", "en"]) {
    revalidatePath(`/${locale}/media-room/favorites`);
  }
}

/** 企業のフォローを解除 */
export async function unfollowCompany(companyId: string) {
  const userId = await requireUser();
  await prisma.companyFollow.deleteMany({ where: { userId, companyId } });
  for (const locale of ["zh", "en"]) {
    revalidatePath(`/${locale}/media-room/following`);
  }
}
