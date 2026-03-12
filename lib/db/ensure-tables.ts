import { neon } from "@neondatabase/serverless";

/**
 * 인증 API 사용 전 호출.
 * users, oauth_accounts, sessions, verification_tokens 테이블이 없으면 생성.
 * 서버리스에서 cold start당 한 번만 실행되도록 호출 측에서 캐시 권장.
 */
export async function ensureAuthTables(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL 환경 변수가 설정되지 않았습니다.");
  }

  const sql = neon(connectionString);

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email varchar(255) NOT NULL UNIQUE,
      name varchar(255),
      image varchar(512),
      email_verified timestamptz,
      telegram_id varchar(64),
      role varchar(32) NOT NULL DEFAULT 'FREE',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS locale varchar(8)`;

  await sql`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      preferences jsonb NOT NULL DEFAULT '{}',
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS oauth_accounts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type varchar(32) NOT NULL,
      provider varchar(64) NOT NULL,
      provider_account_id varchar(256) NOT NULL,
      access_token text,
      refresh_token text,
      expires_at integer,
      token_type varchar(64),
      scope text,
      id_token text,
      session_state varchar(512),
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS oauth_accounts_provider_provider_account_id_idx
    ON oauth_accounts (provider, provider_account_id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      session_token varchar(512) PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires timestamptz NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier varchar(255) NOT NULL,
      token varchar(512) NOT NULL,
      expires timestamptz NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS telegram_link_tokens (
      token varchar(64) PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL
    )
  `;
}
