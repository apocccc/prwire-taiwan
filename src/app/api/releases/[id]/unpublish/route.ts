import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, getOwnedRelease } from "@/lib/api-auth";
import { revalidateReleasePaths } from "@/lib/revalidate";

/** 公開中・予約中のリリースを非公開化 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiRole(["PUBLISHER", "ADMIN"]);
  if (error) return error;
  const { id } = await params;
  const release = await getOwnedRelease(id, session);
  if (!release) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!["PUBLISHED", "SCHEDULED", "IN_REVIEW"].includes(release.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const nextStatus = release.status === "PUBLISHED" ? "UNPUBLISHED" : "DRAFT";
  await prisma.pressRelease.update({
    where: { id },
    data: { status: nextStatus, scheduledAt: null },
  });
  revalidateReleasePaths();
  return NextResponse.json({ ok: true, status: nextStatus });
}
