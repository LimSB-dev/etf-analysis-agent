/**
 * ETF 시세 API (GET /api/etf/[symbol])
 * - getCachedData로 60초 캐시 적용. 캐시 히트 시 외부 API 호출 없이 KV에서 반환
 * - 예: GET /api/etf/tiger-nas100 → { etf, index, fx }
 */

import { NextRequest } from "next/server"
import { getCachedData } from "@/lib/cache"
import { fetchMarketDataRaw } from "@/lib/fetchers"
import { ETF_OPTIONS } from "@/lib/etf-options"

const CACHE_TTL_SECONDS = 60

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await context.params
  const validId = ETF_OPTIONS.some((e) => e.id === symbol) ? symbol : ETF_OPTIONS[0].id
  const cacheKey = `etf:market:${validId}`

  const data = await getCachedData(
    cacheKey,
    () => fetchMarketDataRaw(validId),
    CACHE_TTL_SECONDS,
  )

  return Response.json(data)
}
