import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";

const bodySchema = z.object({ companyId: z.string().min(1) });

/** フォロー状態の取得（?companyId=） */
export async function GET(request: Request) {
  const { session, error } = await requireApiRole(["MEDIA", "ADMIN"]);
  if (error) return error;
  const companyId = new URL(request.url).searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  const follow = await prisma.companyFollow.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
    select: { id: true },
  });
  return NextResponse.json({ following: Boolean(follow) });
}

/** 企業フォローのトグル */
export async function POST(request: Request) {
  const { session, error } = await requireApiRole(["MEDIA", "ADMIN"]);
  if (error) return error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { companyId } = parsed.data;

  const existing = await prisma.companyFollow.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.companyFollow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true },
  });
  if (!company) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await prisma.companyFollow.create({ data: { userId: session.user.id, companyId } });
  return NextResponse.json({ following: true });
}
