import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

/**
 * Neon Serverless Driver (HTTP) 사용.
 * Vercel 등 serverless 환경에서 connection pooling 없이 동작.
 * DATABASE_URL이 없을 때는 더미 URL로 인스턴스를 만들어 빌드·Auth.js 어댑터가 통과하도록 함.
 * (실제 쿼리는 런타임에 연결 실패로 실패함. 배포 시 반드시 DATABASE_URL 설정.)
 */
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://build:build@localhost:1/build?sslmode=disable";

const sql = neon(connectionString);
export const db = drizzle(sql);
