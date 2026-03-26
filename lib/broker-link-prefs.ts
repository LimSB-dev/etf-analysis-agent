/**
 * 텔레그램 chat_id별 빠른 이동 링크 선택 — KV 저장
 * - 키 없음(null): 레거시 — TELEGRAM_INCLUDE_BROKER_APP_SCHEMES 환경 변수 따름
 * - 빈 배열 또는 id 배열: 해당 링크만(네이버·토스·증권사, 최대 MAX_QUICK_LINK_SELECTIONS개)
 */

import { kv } from "@/lib/cache"
import { BROKER_DEEP_LINK_IDS, MAX_QUICK_LINK_SELECTIONS } from "@/lib/broker-deep-links"

const PREFIX = "telegram:broker_prefs:"
const ALLOWED_IDS = new Set<string>(BROKER_DEEP_LINK_IDS)

function key(chatId: number): string {
  return `${PREFIX}${chatId}`
}

/** null = 사용자가 아직 설정 안 함(레거시·환경 변수). [] = 명시적으로 앱 스킴 없음 */
export async function getBrokerLinkPrefs(
  chatId: number,
): Promise<string[] | null> {
  if (!kv) {
    return null
  }
  try {
    const raw = await kv.get<string>(key(chatId))
    if (raw == null) {
      return null
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return null
    }
    const ids = parsed.filter(
      (x): x is string => typeof x === "string" && ALLOWED_IDS.has(x),
    )
    return [...new Set(ids)].slice(0, MAX_QUICK_LINK_SELECTIONS)
  } catch {
    return null
  }
}

export function normalizeBrokerIds(ids: string[]): string[] {
  return [...new Set(ids.filter((id) => ALLOWED_IDS.has(id)))].slice(
    0,
    MAX_QUICK_LINK_SELECTIONS,
  )
}

/** 명시적 저장(빈 배열 가능). 성공 시 이후 get은 배열만 반환 */
export async function setBrokerLinkPrefs(
  chatId: number,
  ids: string[],
): Promise<boolean> {
  if (!kv) {
    return false
  }
  try {
    const normalized = normalizeBrokerIds(ids)
    await kv.set(key(chatId), JSON.stringify(normalized))
    return true
  } catch {
    return false
  }
}

const PENDING_KEY = (chatId: number) => `telegram:brk_pending:${chatId}`

/** 인라인 다중 선택 중인 임시 선택 (토글마다 갱신) */
export async function getPendingBrokerSel(
  chatId: number,
): Promise<string[] | null> {
  if (!kv) {
    return null
  }
  try {
    const raw = await kv.get<string>(PENDING_KEY(chatId))
    if (raw == null) {
      return null
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return null
    }
    return normalizeBrokerIds(parsed.filter((x) => typeof x === "string"))
  } catch {
    return null
  }
}

export async function setPendingBrokerSel(
  chatId: number,
  ids: string[],
): Promise<boolean> {
  if (!kv) {
    return false
  }
  try {
    await kv.set(PENDING_KEY(chatId), JSON.stringify(normalizeBrokerIds(ids)), {
      ex: 3600,
    })
    return true
  } catch {
    return false
  }
}

export async function clearPendingBrokerSel(chatId: number): Promise<void> {
  if (!kv) {
    return
  }
  try {
    await kv.del(PENDING_KEY(chatId))
  } catch {
    // ignore
  }
}
