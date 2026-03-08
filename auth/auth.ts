import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, oauthAccounts, sessions } from "@/lib/db/schema";
import { authConfig } from "./auth.config";

/**
 * Auth.js(NextAuth) 설정.
 * - Drizzle 어댑터로 Neon PostgreSQL 사용
 * - 커스텀 users / oauth_accounts / sessions 테이블 사용
 * - 하나의 사용자 계정에 여러 OAuth 제공자 연결 가능
 */
export const authOptions = {
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: oauthAccounts,
    sessionsTable: sessions,
  }),
};

export const auth = () => NextAuth(authOptions);
