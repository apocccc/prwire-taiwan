import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";

const accountSchema = z.object({
  name: z.string().max(120).nullable().optional(),
});

/** 登録情報（表示名）の更新 */
export async function PUT(request: Request) {
  const { session, error } = await requireApiRole(["PUBLISHER", "MEDIA", "ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = accountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name?.trim() || null },
  });
  return NextResponse.json({ ok: true });
}
