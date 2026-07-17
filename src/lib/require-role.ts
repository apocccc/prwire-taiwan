import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";

/**
 * サーバーコンポーネント / Route Handler 用のロール検証。
 * ミドルウェアの保護に加えた二重チェック（APIレベルでのロール検証要件）。
 */
export async function requireRole(locale: string, roles: Role[]) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }
  if (!roles.includes(session.user.role)) {
    redirect(`/${locale}`);
  }
  return session;
}
