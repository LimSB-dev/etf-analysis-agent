import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// 사용자 테이블 (users)
// 서비스의 실제 사용자 계정. OAuth 제공자와 독립적인 사용자 정보 저장.
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  image: varchar("image", { length: 512 }),
  // Auth.js 어댑터 호환
  emailVerified: timestamp("email_verified", { withTimezone: true, mode: "date" }),
  // 확장 필드
  telegramId: varchar("telegram_id", { length: 64 }),
  locale: varchar("locale", { length: 8 }),
  role: varchar("role", { length: 32 }).notNull().default("FREE"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// 사용자별 ETF 프리미엄 기준 (한 유저 1 row, JSONB)
// - 읽기/쓰기 모두 user_id 기준 전체 조회·전체 갱신만 하므로 row 수·쿼리 수·메모리 유리
// - preferences: { [etfId]: { buyPremiumThreshold, sellPremiumThreshold } }
// ---------------------------------------------------------------------------

export type UserPreferencesJsonType = Record<
  string,
  { buyPremiumThreshold: number; sellPremiumThreshold: number }
>;

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  preferences: jsonb("preferences")
    .$type<UserPreferencesJsonType>()
    .notNull()
    .default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// OAuth 계정 테이블 (oauth_accounts)
// 하나의 user_id에 여러 provider가 연결될 수 있음.
// UNIQUE(provider, provider_account_id)로 동일 제공자 내 계정 중복 방지.
// ---------------------------------------------------------------------------

export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 32 }).notNull(),
    provider: varchar("provider", { length: 64 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 256 }).notNull(),
    access_token: text("access_token"),
    refresh_token: text("refresh_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 64 }),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 512 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("oauth_accounts_provider_provider_account_id_idx").on(
      table.provider,
      table.providerAccountId
    ),
  ]
);

// ---------------------------------------------------------------------------
// 세션 테이블 (sessions) - DB 세션 전략 사용 시 필요
// ---------------------------------------------------------------------------

export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 512 }).primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
});

// ---------------------------------------------------------------------------
// 검증 토큰 테이블 (Magic Link 등 사용 시 선택)
// ---------------------------------------------------------------------------

export const verificationTokens = pgTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 512 }).notNull(),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
});

// ---------------------------------------------------------------------------
// 텔레그램 알림 연결용 일회성 토큰 (마이페이지 → 봇 /start 시 사용자 연결)
// ---------------------------------------------------------------------------

export const telegramLinkTokens = pgTable("telegram_link_tokens", {
  token: varchar("token", { length: 64 }).primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" })
    .notNull(),
});

// ---------------------------------------------------------------------------
// AI 생성 투자 글 (매일 cron으로 1편 생성·저장)
// ---------------------------------------------------------------------------

export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 512 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  content: text("content").notNull(),
  locale: varchar("locale", { length: 8 }).notNull().default("ko"),
  publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export type ArticleType = typeof articles.$inferSelect;
export type NewArticleType = typeof articles.$inferInsert;

// ---------------------------------------------------------------------------
// Type export (선택)
// ---------------------------------------------------------------------------

export type UserType = typeof users.$inferSelect;
export type NewUserType = typeof users.$inferInsert;
export type UserPreferencesType = typeof userPreferences.$inferSelect;
export type NewUserPreferencesType = typeof userPreferences.$inferInsert;
export type OAuthAccountType = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccountType = typeof oauthAccounts.$inferInsert;
export type TelegramLinkTokenType = typeof telegramLinkTokens.$inferSelect;
export type NewTelegramLinkTokenType = typeof telegramLinkTokens.$inferInsert;
