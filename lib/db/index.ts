import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

/**
 * Neon Serverless Driver (HTTP) 사용.
 * Vercel 등 serverless 환경에서 connection pooling 없이 동작.
 * DATABASE_URL이 없을 때는 import 시점에 throw하지 않고, 실제 사용 시 throw하여
 * 빌드(collect page data)가 환경 변수 없이 통과할 수 있게 함.
 */
const connectionString = process.env.DATABASE_URL;

const _db = connectionString
  ? drizzle(neon(connectionString))
  : null;

type DbType = NonNullable<typeof _db>;

const noDbProxy = new Proxy({} as DbType, {
  get() {
    throw new Error("DATABASE_URL 환경 변수가 설정되지 않았습니다.");
  },
});

export const db: DbType = _db ?? (noDbProxy as DbType);
