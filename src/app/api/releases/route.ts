import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { generateShortId } from "@/lib/slug";

/** 新規リリース（下書き）作成 */
export async function POST() {
  const { session, error } = await requireApiRole(["PUBLISHER"]);
  if (error) return error;

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!company) {
    return NextResponse.json({ error: "no_company" }, { status: 400 });
  }

  const release = await prisma.pressRelease.create({
    data: {
      companyId: company.id,
      slug: generateShortId(),
      status: "DRAFT",
    },
    select: { id: true },
  });

  return NextResponse.json({ id: release.id }, { status: 201 });
}
