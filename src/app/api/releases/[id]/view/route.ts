import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.pressRelease.update({
      where: { id, status: "PUBLISHED" },
      data: { viewCount: { increment: 1 } },
    });
  } catch {
    // 存在しない/非公開のリリースは無視
  }
  return new NextResponse(null, { status: 204 });
}
