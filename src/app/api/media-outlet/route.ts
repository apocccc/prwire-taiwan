import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";

const schema = z.object({
  outletName: z.string().min(1).max(200),
  outletUrl: z.string().url().max(500),
  contactName: z.string().min(1).max(100),
  contactTitle: z.string().max(100).nullable().optional(),
  contactEmail: z.string().email().max(320),
  contactPhone: z.string().max(50).nullable().optional(),
  coverageArea: z.string().min(1).max(500),
});

/** メディアが自身の登録情報を更新 */
export async function PUT(request: Request) {
  const { session, error } = await requireApiRole(["MEDIA"]);
  if (error) return error;

  const outlet = await prisma.mediaOutlet.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!outlet) return NextResponse.json({ error: "no_outlet" }, { status: 400 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }
  const d = parsed.data;
  await prisma.mediaOutlet.update({
    where: { id: outlet.id },
    data: {
      outletName: d.outletName,
      outletUrl: d.outletUrl,
      contactName: d.contactName,
      contactTitle: d.contactTitle || null,
      contactEmail: d.contactEmail,
      contactPhone: d.contactPhone || null,
      coverageArea: d.coverageArea,
    },
  });
  return NextResponse.json({ ok: true });
}
