import { defineConfig } from "drizzle-kit";

// 터미널에서 실행 시: DATABASE_URL이 .env.local에 있으면
// `source .env.local 2>/dev/null; npx drizzle-kit push` 또는 Next.js 환경에서 실행
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL 환경 변수가 설정되지 않았습니다.");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
