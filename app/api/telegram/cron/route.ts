/**
 * CRON: 중요한 것은 **메시지 도착 시각이 아니라, 몇 시 시세로 계산했는지**임.
 * - 09:30 KST에 이 API가 호출되어야 getEtfList()가 09:30 시세로 괴리율·신호를 계산함.
 * - Vercel Cron은 지연이 크므로, 09:30 기준 값을 쓰려면 외부 cron으로 09:30 KST에 이 URL 호출 권장.
 */

import { NextRequest, NextResponse } from "next/server"
import { eq, sql } from "drizzle-orm"
import { ETFS } from "@/lib/constants/etfs"
import { db } from "@/lib/db"
import { users, userPreferences } from "@/lib/db/schema"
import { getEtfList, type EtfApiItemType } from "@/lib/getEtfList"
import { ETF_OPTIONS } from "@/lib/etf-options"
import { listSubscriptions } from "@/lib/subscriptions"
import { sendToChannel, sendText } from "@/lib/telegram"

/** 숫자 포맷 (천 단위 구분, 소수는 premium만) */
function formatPrice(value: number): string {
  return Math.round(value).toLocaleString("ko-KR")
}

function formatPremium(value: number): string {
  return `${value.toFixed(2)}%`
}

/** KST 기준 시각 문자열 (예: 2025-03-10 09:30) */
function formatKstTime(date: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }
  const parts = new Intl.DateTimeFormat("ko-KR", opts).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  const y = get("year")
  const m = get("month").padStart(2, "0")
  const d = get("day").padStart(2, "0")
  const h = get("hour").padStart(2, "0")
  const min = get("minute").padStart(2, "0")
  return `${y}-${m}-${d} ${h}:${min}`
}

/** ETF 목록을 한 메시지로 요약 (BUY/SELL 신호 포함). 기준 시각은 계산 시점(데이터 조회 시점) */
function buildBroadcastMessage(
  etfList: EtfApiItemType[],
  calculatedAt: Date,
): string {
  const kst = formatKstTime(calculatedAt)
  const lines = [`📊 ETF 괴리율 알림 (기준 시각: ${kst} KST)`, ""]
  for (const etf of etfList) {
    const signal =
      etf.signal === "BUY"
        ? "🟢 BUY"
        : etf.signal === "SELL"
          ? "🔴 SELL"
          : "⚪ HOLD"
    lines.push(
      `${etf.name}\n` +
        `현재가 ${formatPrice(etf.price)} · 괴리율 ${formatPremium(etf.premium)} ${signal}`,
    )
    lines.push("")
  }
  return lines.join("\n").trimEnd()
}

export async function GET(request: NextRequest) {
  const startedAt = new Date().toISOString()
  console.log("[cron:start]", startedAt, "UTC")

  // Vercel Cron은 Authorization: Bearer ${CRON_SECRET} 헤더로 호출됨. 반드시 CRON_SECRET 설정 필요.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 },
    )
  }
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace(/^Bearer\s+/i, "")
  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let etfList: EtfApiItemType[]
  try {
    etfList = await getEtfList()
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: "ETF data failed", detail: err },
      { status: 502 },
    )
  }

  const calculatedAt = new Date()
  const message = buildBroadcastMessage(etfList, calculatedAt)
  const beforeSend = new Date().toISOString()
  console.log("[cron:beforeSend]", beforeSend, "UTC")
  const channelResult = await sendToChannel(message)
  if (!channelResult.ok) {
    return NextResponse.json(
      { error: "Telegram send failed", detail: channelResult.error },
      { status: 502 },
    )
  }

  const etfByTicker = new Map(etfList.map((e) => [e.ticker, e]))
  let personalSent = 0

  // 1) KV 구독 (봇에서 ETF/기준 선택한 사용자)
  const subscriptions = await listSubscriptions()
  for (const sub of subscriptions) {
    const etf = etfByTicker.get(sub.etf_ticker)
    if (!etf) {
      continue
    }
    const buyTrigger = etf.premium <= sub.premium_threshold
    const sellTrigger =
      sub.sell_threshold != null && etf.premium >= sub.sell_threshold
    if (!buyTrigger && !sellTrigger) {
      continue
    }
    const signal =
      buyTrigger && sellTrigger
        ? "🟢 매수 / 🔴 매도"
        : buyTrigger
          ? "🟢 매수"
          : "🔴 매도"
    const line =
      `${etf.name}\n` +
      `현재가 ${formatPrice(etf.price)} · 괴리율 ${formatPremium(etf.premium)} ${signal}`
    const res = await sendText(sub.chat_id, line)
    if (res.ok) {
      personalSent += 1
    }
  }

  // 2) DB 연동 사용자 (마이페이지 관심 리스트 + /start 토큰으로 연결한 사용자)
  const linkedUsers = await db
    .select({
      telegramId: users.telegramId,
      preferences: userPreferences.preferences,
    })
    .from(users)
    .innerJoin(userPreferences, eq(users.id, userPreferences.userId))
    .where(sql`${users.telegramId} is not null`)

  for (const row of linkedUsers) {
    const chatId = Number.parseInt(row.telegramId ?? "", 10)
    if (!Number.isFinite(chatId)) {
      continue
    }
    const prefs = row.preferences ?? {}
    for (const [etfId, p] of Object.entries(prefs)) {
      if (!p || typeof p.buyPremiumThreshold !== "number") {
        continue
      }
      const ticker = ETF_OPTIONS.find((o) => o.id === etfId)?.code ?? null
      if (!ticker || !ETFS.some((e) => e.ticker === ticker)) {
        continue
      }
      const etf = etfByTicker.get(ticker)
      if (!etf) {
        continue
      }
      const buyTrigger = etf.premium <= (p.buyPremiumThreshold ?? -1)
      const sellTrigger =
        typeof p.sellPremiumThreshold === "number" &&
        etf.premium >= p.sellPremiumThreshold
      if (!buyTrigger && !sellTrigger) {
        continue
      }
      const signal =
        buyTrigger && sellTrigger
          ? "🟢 매수 / 🔴 매도"
          : buyTrigger
            ? "🟢 매수"
            : "🔴 매도"
      const line =
        `${etf.name}\n` +
        `현재가 ${formatPrice(etf.price)} · 괴리율 ${formatPremium(etf.premium)} ${signal}`
      const res = await sendText(chatId, line)
      if (res.ok) {
        personalSent += 1
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sent: 1,
    personalSent,
  })
}
