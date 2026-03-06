/**
 * Vercel KV 연결 확인 (개발/디버깅용)
 * GET /api/kv-check → KV_REST_API_URL + KV_REST_API_TOKEN 사용 가능 여부 확인
 */

import { kv } from "@/lib/cache"
import { NextResponse } from "next/server"

const TEST_KEY = "etf:kv-check-ping"

const KV_ENV_KEYS = [
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "KV_REST_API_READ_ONLY_TOKEN",
] as const

export async function GET() {
  const hasUrl = Boolean(process.env.KV_REST_API_URL)
  const hasToken = Boolean(
    process.env.KV_REST_API_TOKEN ?? process.env.KV_REST_API_READ_ONLY_TOKEN,
  )

  const presentKeys = KV_ENV_KEYS.filter(
    (key) => process.env[key] != null && process.env[key] !== "",
  )

  if (!hasUrl || !hasToken) {
    return NextResponse.json(
      {
        ok: false,
        message: "KV env not set",
        env: {
          hasUrl,
          hasToken,
          hint: "Connect Upstash KV in Vercel (Integrations) or set KV_REST_API_URL + KV_REST_API_TOKEN",
          presentKeys: presentKeys.length > 0 ? presentKeys : "none",
        },
      },
      { status: 503 },
    )
  }

  if (!kv) {
    return NextResponse.json(
      { ok: false, message: "KV client not initialized" },
      { status: 503 },
    )
  }

  try {
    await kv.set(TEST_KEY, Date.now(), { ex: 10 })
    const value = await kv.get<number>(TEST_KEY)
    return NextResponse.json({
      ok: true,
      message: "KV connected",
      ping: value != null ? "read/write OK" : "write OK, read failed",
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        ok: false,
        message: "KV connection failed",
        error: err,
      },
      { status: 503 },
    )
  }
}
