import type { NextAuthConfig } from "next-auth";

/**
 * Edge 互換の Auth.js 設定（middleware から参照される）。
 * Prisma 等の Node 依存はここに置かず、src/auth.ts 側に置く。
 */
export const authConfig = {
  pages: {
    signIn: "/zh/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.role && token.status) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.status = token.status;
      }
      return session;
    },
  },
  providers: [], // プロバイダーは src/auth.ts で追加（Edge で bcrypt を読み込まないため）
} satisfies NextAuthConfig;
