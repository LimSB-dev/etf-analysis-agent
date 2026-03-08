import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL 환경 변수가 설정되지 않았습니다.");
}

/**
 * Neon Serverless Driver (HTTP) 사용.
 * Vercel 등 serverless 환경에서 connection pooling 없이 동작.
 */
const sql = neon(connectionString);
export const db = drizzle(sql);
