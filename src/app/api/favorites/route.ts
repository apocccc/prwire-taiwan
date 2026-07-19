import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";

const bodySchema = z.object({ releaseId: z.string().min(1) });

/** お気に入り状態の取得（?releaseId=） */
export async function GET(request: Request) {
  const { session, error } = await requireApiRole(["MEDIA", "ADMIN"]);
  if (error) return error;
  const releaseId = new URL(request.url).searchParams.get("releaseId");
  if (!releaseId) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  const fav = await prisma.favorite.findUnique({
    where: { userId_releaseId: { userId: session.user.id, releaseId } },
    select: { id: true },
  });
  return NextResponse.json({ favorited: Boolean(fav) });
}

/** お気に入りのトグル */
export async function POST(request: Request) {
  const { session, error } = await requireApiRole(["MEDIA", "ADMIN"]);
  if (error) return error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { releaseId } = parsed.data;

  const existing = await prisma.favorite.findUnique({
    where: { userId_releaseId: { userId: session.user.id, releaseId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }
  // リリースの存在確認（外部キーエラーを避ける）
  const release = await prisma.pressRelease.findUnique({
    where: { id: releaseId },
    select: { id: true },
  });
  if (!release) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await prisma.favorite.create({ data: { userId: session.user.id, releaseId } });
  return NextResponse.json({ favorited: true });
}
