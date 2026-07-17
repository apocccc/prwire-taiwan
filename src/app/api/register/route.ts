import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation/register";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);

  try {
    if (data.type === "publisher") {
      const slugTaken = await prisma.company.findUnique({
        where: { slug: data.companySlug },
        select: { id: true },
      });
      if (slugTaken) {
        return NextResponse.json({ error: "slug_taken" }, { status: 409 });
      }

      // 事業者は即時利用可（リリース自体が審査制のため）
      await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "PUBLISHER",
          status: "ACTIVE",
          name: data.companyNameZh,
          termsAcceptedAt: new Date(),
          company: {
            create: {
              slug: data.companySlug,
              nameZh: data.companyNameZh,
              nameEn: data.companyNameEn || null,
              websiteUrl: data.websiteUrl || null,
            },
          },
        },
      });
      return NextResponse.json({ ok: true, status: "ACTIVE" }, { status: 201 });
    }

    // メディアは管理者承認制（承認まで PENDING でログイン不可）
    await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: "MEDIA",
        status: "PENDING",
        name: data.contactName,
        termsAcceptedAt: new Date(),
        mediaOutlet: {
          create: {
            outletName: data.outletName,
            outletUrl: data.outletUrl,
            contactName: data.contactName,
            contactEmail: data.contactEmail,
            coverageArea: data.coverageArea,
          },
        },
      },
    });
    return NextResponse.json({ ok: true, status: "PENDING" }, { status: 201 });
  } catch (e) {
    // ユニーク制約競合（同時登録）
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    console.error("register failed", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
