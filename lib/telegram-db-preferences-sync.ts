/**
 * 텔레그램 봇 구독과 마이페이지 user_preferences 동기화
 * (telegramId가 연결된 계정만 DB 갱신)
 */

import { eq } from "drizzle-orm"
import { ETF_OPTIONS } from "@/lib/etf-options"
import { db } from "@/lib/db"
import {
  userPreferences,
  users,
  type UserPreferencesJsonType,
} from "@/lib/db/schema"
import { listSubscriptions } from "@/lib/subscriptions"

export function etfTickerToPreferenceId(ticker: string): string | null {
  return ETF_OPTIONS.find((o) => o.code === ticker)?.id ?? null
}

export async function getUserIdByTelegramChatId(
  chatId: number,
): Promise<string | null> {
  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.telegramId, String(chatId)))
    .limit(1)
    .then((r) => r[0] ?? null)
  return row?.id ?? null
}

async function readPreferencesMap(
  userId: string,
): Promise<UserPreferencesJsonType> {
  const row = await db
    .select({ preferences: userPreferences.preferences })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1)
    .then((r) => r[0] ?? null)
  const raw = row?.preferences ?? {}
  return { ...raw }
}

async function writePreferencesMap(
  userId: string,
  prefs: UserPreferencesJsonType,
): Promise<void> {
  await db
    .insert(userPreferences)
    .values({
      userId,
      preferences: prefs,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { preferences: prefs, updatedAt: new Date() },
    })
}

/**
 * 봇에서 한 건 구독이 확정됐을 때, 연결된 웹 계정 관심 리스트에 반영
 */
export async function upsertUserPreferenceFromTelegramSubscription(args: {
  chatId: number
  etfTicker: string
  buyPremiumThreshold: number
  sellThreshold?: number
}): Promise<{ synced: boolean }> {
  const userId = await getUserIdByTelegramChatId(args.chatId)
  if (!userId) {
    return { synced: false }
  }
  const etfId = etfTickerToPreferenceId(args.etfTicker)
  if (!etfId) {
    return { synced: false }
  }
  const prefs = await readPreferencesMap(userId)
  prefs[etfId] = {
    buyPremiumThreshold: args.buyPremiumThreshold,
    sellPremiumThreshold:
      args.sellThreshold == null ? null : args.sellThreshold,
  }
  await writePreferencesMap(userId, prefs)
  return { synced: true }
}

/**
 * /start 토큰 연동 직전: 웹에 없는 종목만 KV 구독을 DB에 채움(웹 설정 우선)
 */
export async function mergeKvOnlySubscriptionsIntoUserPreferences(args: {
  userId: string
  chatId: number
}): Promise<void> {
  const all = await listSubscriptions()
  const mine = all.filter((s) => s.chat_id === args.chatId)
  if (mine.length === 0) {
    return
  }
  const prefs = await readPreferencesMap(args.userId)
  let changed = false
  for (const sub of mine) {
    const etfId = etfTickerToPreferenceId(sub.etf_ticker)
    if (!etfId || etfId in prefs) {
      continue
    }
    prefs[etfId] = {
      buyPremiumThreshold: sub.premium_threshold,
      sellPremiumThreshold:
        sub.sell_threshold == null ? null : sub.sell_threshold,
    }
    changed = true
  }
  if (changed) {
    await writePreferencesMap(args.userId, prefs)
  }
}

/**
 * 마이페이지 preferences JSON에서 스냅샷용 네이버 종목 코드(6자리) 목록 추출
 */
export function subscribedTickersFromPreferences(
  prefs: UserPreferencesJsonType | Record<string, unknown> | null | undefined,
): string[] {
  if (!prefs || typeof prefs !== "object") {
    return []
  }
  const out: string[] = []
  for (const [etfId, raw] of Object.entries(prefs)) {
    if (!raw || typeof raw !== "object") {
      continue
    }
    const p = raw as { buyPremiumThreshold?: unknown }
    if (typeof p.buyPremiumThreshold !== "number") {
      continue
    }
    const code = ETF_OPTIONS.find((o) => o.id === etfId)?.code
    if (code) {
      out.push(code)
    }
  }
  return out
}

/**
 * /my · /subs: KV 구독 + (텔레그램 연동 시) DB 관심 ETF 티커 합집합
 */
export async function getSubscribedTickersForTelegramChat(
  chatId: number,
): Promise<string[]> {
  const all = await listSubscriptions()
  const fromKv = all.filter((s) => s.chat_id === chatId).map((s) => s.etf_ticker)
  const userId = await getUserIdByTelegramChatId(chatId)
  let fromDb: string[] = []
  if (userId) {
    const row = await db
      .select({ preferences: userPreferences.preferences })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1)
      .then((r) => r[0] ?? null)
    fromDb = subscribedTickersFromPreferences(
      (row?.preferences ?? {}) as UserPreferencesJsonType,
    )
  }
  return [...new Set([...fromKv, ...fromDb])]
}
