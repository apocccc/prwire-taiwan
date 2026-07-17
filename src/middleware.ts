import NextAuth from "next-auth";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { routing } from "@/i18n/routing";
import type { Role } from "@prisma/client";

const intlMiddleware = createIntlMiddleware(routing);
const { auth } = NextAuth(authConfig);

/** ロケールプレフィックスを除いたパスで判定する保護領域 */
const PROTECTED: { prefix: string; roles: Role[] }[] = [
  { prefix: "/dashboard", roles: ["PUBLISHER", "ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/media-room", roles: ["MEDIA", "ADMIN"] },
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // /zh/... /en/... → ロケールを除いたパス
  const stripped = pathname.replace(/^\/(zh|en)(?=\/|$)/, "") || "/";
  const locale = pathname.match(/^\/(zh|en)(?=\/|$)/)?.[1] ?? routing.defaultLocale;

  const rule = PROTECTED.find(
    (r) => stripped === r.prefix || stripped.startsWith(`${r.prefix}/`)
  );

  if (rule) {
    const user = req.auth?.user;
    if (!user) {
      const loginUrl = new URL(`/${locale}/login`, req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!rule.roles.includes(user.role)) {
      return NextResponse.redirect(new URL(`/${locale}`, req.nextUrl.origin));
    }
  }

  return intlMiddleware(req);
});

export const config = {
  // API・静的ファイル・Next内部パスを除く全リクエスト
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
