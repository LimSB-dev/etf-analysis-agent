/**
 * user_etf_preferences → user_preferences 마이그레이션
 * - user_preferences 테이블 생성 (한 유저 1 row, JSONB)
 * - 기존 user_etf_preferences 데이터를 집계해 user_preferences로 복사
 *
 * 실행: npm run db:migrate
 * (.env.local 또는 DATABASE_URL 필요)
 */

import { config } from "dotenv";

config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL 환경 변수를 설정하세요. (예: .env.local)");
  process.exit(1);
}

const sql = neon(connectionString);

async function run() {
  console.log("1. user_preferences 테이블 생성...");
  await sql`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      preferences jsonb NOT NULL DEFAULT '{}',
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  console.log("2. user_etf_preferences → user_preferences 데이터 이전...");
  const result = await sql`
    INSERT INTO user_preferences (user_id, preferences, updated_at)
    SELECT
      user_id,
      coalesce(
        jsonb_object_agg(
          etf_id,
          jsonb_build_object(
            'buyPremiumThreshold', buy_premium_threshold,
            'sellPremiumThreshold', sell_premium_threshold
          )
        ),
        '{}'::jsonb
      ),
      max(updated_at)
    FROM user_etf_preferences
    GROUP BY user_id
    ON CONFLICT (user_id) DO NOTHING
  `;

  console.log("마이그레이션 완료.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
