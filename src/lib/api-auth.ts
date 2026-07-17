import "server-only";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Route Handler 用のロール検証（メディア限定コンテンツ等はフロントの出し分けに頼らず
 * 必ずAPIレベルでこの関数を通す）。
 */
export async function requireApiRole(
  roles: Role[]
): Promise<{ session: Session; error?: never } | { session?: never; error: NextResponse }> {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  if (session.user.status !== "ACTIVE" || !roles.includes(session.user.role)) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { session };
}

/** 自分の会社のリリースのみ操作可（ADMINは全リリース可） */
export async function getOwnedRelease(releaseId: string, session: Session) {
  const release = await prisma.pressRelease.findUnique({
    where: { id: releaseId },
    include: {
      company: { select: { id: true, userId: true, slug: true } },
      images: true,
      categories: true,
      mediaOnlyInfo: true,
      mediaKitFiles: true,
    },
  });
  if (!release) return null;
  if (session.user.role !== "ADMIN" && release.company.userId !== session.user.id) {
    return null;
  }
  return release;
}
