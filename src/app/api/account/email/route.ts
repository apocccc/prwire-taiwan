import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { hashPassword, verifyPassword } from "@/lib/password";

export const runtime = "nodejs";

const CODE_TTL_MS = 15 * 60 * 1000; // 15分

const requestSchema = z.object({ newEmail: z.string().email().max(200) });
const confirmSchema = z.object({ code: z.string().min(4).max(12) });

/**
 * 登録メールアドレス変更 - 認証コードの発行。
 * 新しいアドレス宛に6桁コードを送る想定。メール基盤が未接続の本環境では
 * レスポンスに devCode を含めて動作確認できるようにしている（本番では送らない）。
 */
export async function POST(request: Request) {
  const { session, error } = await requireApiRole(["PUBLISHER", "MEDIA", "ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }
  const newEmail = parsed.data.newEmail.toLowerCase().trim();

  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  if (current?.email === newEmail) {
    return NextResponse.json({ error: "same_email" }, { status: 400 });
  }
  const taken = await prisma.user.findUnique({ where: { email: newEmail } });
  if (taken) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6桁
  const emailChangeCode = await hashPassword(code);
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      pendingEmail: newEmail,
      emailChangeCode,
      emailChangeExpires: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  // TODO: 本番ではここでメール送信し devCode は返さない
  return NextResponse.json({ ok: true, devCode: code });
}

/** 登録メールアドレス変更 - コード確認して確定 */
export async function PUT(request: Request) {
  const { session, error } = await requireApiRole(["PUBLISHER", "MEDIA", "ADMIN"]);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      pendingEmail: true,
      emailChangeCode: true,
      emailChangeExpires: true,
    },
  });
  if (!user?.pendingEmail || !user.emailChangeCode || !user.emailChangeExpires) {
    return NextResponse.json({ error: "no_pending_change" }, { status: 400 });
  }
  if (user.emailChangeExpires.getTime() < Date.now()) {
    return NextResponse.json({ error: "code_expired" }, { status: 400 });
  }
  const ok = await verifyPassword(parsed.data.code, user.emailChangeCode);
  if (!ok) {
    return NextResponse.json({ error: "code_invalid" }, { status: 400 });
  }

  // 二重登録防止（発行後に他ユーザーが取得していないか再確認）
  const taken = await prisma.user.findUnique({ where: { email: user.pendingEmail } });
  if (taken) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      email: user.pendingEmail,
      pendingEmail: null,
      emailChangeCode: null,
      emailChangeExpires: null,
    },
  });
  return NextResponse.json({ ok: true, email: user.pendingEmail });
}
