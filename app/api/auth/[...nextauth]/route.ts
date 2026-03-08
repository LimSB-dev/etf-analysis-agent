import NextAuth from "next-auth";
import { authOptions } from "@/auth/auth";
import { ensureAuthTables } from "@/lib/db/ensure-tables";

const handler = NextAuth(authOptions);

/** cold start당 한 번만 테이블 생성 시도 */
let ensurePromise: Promise<void> | null = null;

async function withEnsureTables(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  ensurePromise ??= ensureAuthTables().catch(() => {
    ensurePromise = null;
  });
  await ensurePromise;
  return handler(req, context);
}

export const GET = withEnsureTables;
export const POST = withEnsureTables;
