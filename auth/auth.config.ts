import type { AuthOptions } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Google OAuth: AUTH_GOOGLE_* 또는 GOOGLE_CLIENT_* 환경 변수 지원
 */
const googleClientId =
  process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "";

/**
 * OAuth 프로바이더 설정.
 * Kakao, Github 등 추가 시 아래 providers 배열에 추가.
 */
export const providerMap = {
  google: Google({
    clientId: googleClientId,
    clientSecret: googleClientSecret,
  }),
  // kakao: Kakao({ ... }),
  // github: Github({ ... }),
} as const;

export type ProviderId = keyof typeof providerMap;

export const authConfig = {
  providers: [providerMap.google],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
} satisfies Omit<AuthOptions, "adapter">;
