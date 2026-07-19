import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";

const companySchema = z.object({
  nameZh: z.string().min(1).max(200),
  nameEn: z.string().max(200).nullable().optional(),
  descriptionZh: z.string().max(2000).nullable().optional(),
  descriptionEn: z.string().max(2000).nullable().optional(),
  websiteUrl: z.string().url().max(500).nullable().optional().or(z.literal("")),
  logoUrl: z.string().max(1000).nullable().optional(),
});

/** 事業者が自社プロフィール（ロゴ含む）を更新 */
export async function PUT(request: Request) {
  const { session, error } = await requireApiRole(["PUBLISHER", "ADMIN"]);
  if (error) return error;

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  });
  if (!company) {
    return NextResponse.json({ error: "no_company" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = companySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }
  const d = parsed.data;

  await prisma.company.update({
    where: { id: company.id },
    data: {
      nameZh: d.nameZh,
      nameEn: d.nameEn || null,
      descriptionZh: d.descriptionZh || null,
      descriptionEn: d.descriptionEn || null,
      websiteUrl: d.websiteUrl || null,
      logoUrl: d.logoUrl || null,
    },
  });

  // 公開の企業ページを再生成
  for (const locale of ["zh", "en"]) {
    revalidatePath(`/${locale}/company/${company.slug}`);
  }
  return NextResponse.json({ ok: true });
}
