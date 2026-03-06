/**
 * 전체 ETF 데이터 단일 API (GET /api/etfs)
 * - KV 캐시(etf:all, TTL 30초) 적용. 캐시 히트 시 외부 API 호출 없이 반환
 * - 페이지에서 ETF 6~8개를 써도 요청은 1번만 발생
 */

import { getEtfList, type EtfApiItemType } from "@/lib/getEtfList"

export type { EtfApiItemType }

export async function GET() {
  const list = await getEtfList()
  return Response.json(list)
}
