"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** メディア（承認済み）本人の MediaOutlet を取得。権限がなければ例外 */
async function assertMediaOutlet() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.status !== "ACTIVE" ||
    session.user.role !== "MEDIA"
  ) {
    throw new Error("forbidden");
  }
  const outlet = await prisma.mediaOutlet.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!outlet) throw new Error("forbidden");
  return outlet;
}

/** カテゴリのフォロー/解除（週次ダイジェストの配信対象になる） */
export async function toggleCategoryFollow(categoryId: string) {
  const outlet = await assertMediaOutlet();

  const existing = await prisma.categoryFollow.findUnique({
    where: {
      mediaOutletId_categoryId: { mediaOutletId: outlet.id, categoryId },
    },
  });
  if (existing) {
    await prisma.categoryFollow.delete({
      where: {
        mediaOutletId_categoryId: { mediaOutletId: outlet.id, categoryId },
      },
    });
  } else {
    await prisma.categoryFollow.create({
      data: { mediaOutletId: outlet.id, categoryId },
    });
  }
  for (const locale of ["zh", "en"]) {
    revalidatePath(`/${locale}/media-room`);
  }
}
