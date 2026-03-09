/**
 * ETF 알림 구독 저장/조회 (Vercel KV 사용)
 * - 구독 목록: telegram:subscriptions (JSON 배열)
 * - 대화 단계 상태: telegram:state:{chat_id} (설정 완료 시 삭제)
 */

import { kv } from "@/lib/cache"

/** 구독 한 건 (premium_threshold: 매수 기준 이하 시 알림, sell_threshold: 매도 기준 이상 시 알림) */
export interface SubscriptionType {
  chat_id: number
  etf_ticker: string
  premium_threshold: number
  sell_threshold?: number
  created_at: string
}

/** 봇 대화 중 임시 상태 (ETF 선택 후 프리미엄 선택 단계 등) */
export interface TelegramStateType {
  step: 2
  selected_ticker: string
  selected_name: string
}

const SUBSCRIPTIONS_KEY = "telegram:subscriptions"
const STATE_KEY_PREFIX = "telegram:state:"

/** 상태 키 만료(초). 1시간 후 자동 삭제 */
const STATE_TTL_SECONDS = 3600

function getStateKey(chatId: number): string {
  return `${STATE_KEY_PREFIX}${chatId}`
}

/**
 * 전체 구독 목록 조회 (CRON에서 사용)
 */
export async function listSubscriptions(): Promise<SubscriptionType[]> {
  if (!kv) {
    return []
  }
  try {
    const raw = await kv.get<string>(SUBSCRIPTIONS_KEY)
    if (raw == null) {
      return []
    }
    return JSON.parse(raw) as SubscriptionType[]
  } catch {
    return []
  }
}

/**
 * 구독 추가 (중복 chat_id + etf_ticker는 기존 항목의 threshold만 갱신)
 */
export async function addSubscription(
  subscription: Omit<SubscriptionType, "created_at">,
): Promise<boolean> {
  if (!kv) {
    return false
  }
  const created_at = new Date().toISOString()
  try {
    const list = await listSubscriptions()
    const existingIndex = list.findIndex(
      (s) => s.chat_id === subscription.chat_id && s.etf_ticker === subscription.etf_ticker,
    )
    const newItem: SubscriptionType = { ...subscription, created_at }
    if (existingIndex >= 0) {
      list[existingIndex] = newItem
    } else {
      list.push(newItem)
    }
    await kv.set(SUBSCRIPTIONS_KEY, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

/**
 * 사용자 대화 상태 조회 (현재 단계, 선택한 ETF 등)
 */
export async function getTelegramState(
  chatId: number,
): Promise<TelegramStateType | null> {
  if (!kv) {
    return null
  }
  try {
    const raw = await kv.get<string>(getStateKey(chatId))
    if (raw == null) {
      return null
    }
    return JSON.parse(raw) as TelegramStateType
  } catch {
    return null
  }
}

/**
 * 사용자 대화 상태 저장 (프리미엄 선택 대기 등)
 */
export async function setTelegramState(
  chatId: number,
  state: TelegramStateType,
): Promise<boolean> {
  if (!kv) {
    return false
  }
  try {
    await kv.set(getStateKey(chatId), JSON.stringify(state), {
      ex: STATE_TTL_SECONDS,
    })
    return true
  } catch {
    return false
  }
}

/**
 * 구독 저장 후 대화 상태 삭제
 */
export async function clearTelegramState(chatId: number): Promise<void> {
  if (!kv) {
    return
  }
  try {
    await kv.del(getStateKey(chatId))
  } catch {
    // 무시
  }
}

/**
 * 특정 chat_id의 모든 구독 제거 (알림 해제 시 사용)
 */
export async function removeSubscriptionsByChatId(
  chatId: number,
): Promise<boolean> {
  if (!kv) {
    return false
  }
  try {
    const list = await listSubscriptions()
    const filtered = list.filter((s) => s.chat_id !== chatId)
    if (filtered.length === list.length) {
      return true
    }
    await kv.set(SUBSCRIPTIONS_KEY, JSON.stringify(filtered))
    return true
  } catch {
    return false
  }
}
