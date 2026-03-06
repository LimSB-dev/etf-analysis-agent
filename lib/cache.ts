/**
 * Vercel KV 기반 캐싱 레이어
 * - 외부 API 요청을 줄이기 위해 60초 TTL 캐시 사용
 * - KV 미설정 시(로컬 등)에는 캐시 없이 fetcher만 실행
 *
 * 환경 변수: Vercel 대시보드(Project → Settings → Environment Variables)에서 관리.
 * Upstash KV 연동 시 KV_REST_API_URL, KV_REST_API_TOKEN 자동 주입.
 */

import { createClient } from "@vercel/kv"

const url = process.env.KV_REST_API_URL
const token =
  process.env.KV_REST_API_TOKEN ?? process.env.KV_REST_API_READ_ONLY_TOKEN

/** KV_REST_API_URL + 토큰이 있으면 클라이언트 반환, 없으면 null (캐시 스킵) */
const kv =
  url && token
    ? createClient({ url, token })
    : null

/** 캐시 TTL 기본값(초). 60초 동안 동일 키는 외부 API 호출 없이 KV에서 반환 */
const DEFAULT_TTL_SECONDS = 60

/**
 * KV에 key가 있으면 반환, 없으면 fetcher 실행 후 결과를 KV에 저장(ttl 적용)하고 반환
 * @param key 캐시 키 (예: "etf:market:tiger-nas100")
 * @param fetcher 캐시 미스 시 실행할 비동기 함수 (외부 API 호출 등)
 * @param ttlSeconds TTL(초). 기본 60
 * @returns 캐시된 값 또는 fetcher 결과
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<T> {
  if (kv) {
    try {
      const cached = await kv.get<string>(key)
      if (cached != null) {
        return JSON.parse(cached) as T
      }
    } catch {
      // KV 오류 시 캐시 스킵
    }
  }

  // 캐시 미스 또는 KV 없음 → fetcher 실행(외부 API 호출). 서버 터미널에서만 보임
  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache] Miss for "${key}" → calling external API (e.g. Naver)`)
  }
  const data = await fetcher()

  if (kv) {
    try {
      await kv.set(key, JSON.stringify(data), { ex: ttlSeconds })
    } catch {
      // 저장 실패해도 데이터는 반환
    }
  }

  return data
}

export { kv }
