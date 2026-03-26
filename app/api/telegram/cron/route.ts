/**
 * CRON: 중요한 것은 **메시지 도착 시각이 아니라, 몇 시 시세로 계산했는지**임.
 * - 15:00 KST에 호출하면 마감(15:30) 전에 알림을 받아 거래할 수 있음.
 * - Vercel Cron은 지연이 있을 수 있으므로, 15:00 기준 값을 쓰려면 외부 cron으로 15:00 KST에 이 URL 호출 권장.
 */

import { NextRequest, NextResponse } from "next/server"
import { eq, inArray, sql } from "drizzle-orm"
import { ETFS } from "@/lib/constants/etfs"
import { db } from "@/lib/db"
import { users, userPreferences } from "@/lib/db/schema"
import { getEtfList, type EtfApiItemType } from "@/lib/getEtfList"
import { ETF_OPTIONS } from "@/lib/etf-options"
import { isValidLocale } from "@/lib/i18n/config"
import type { Locale } from "@/lib/i18n/config"
import { SITE_URL } from "@/lib/site-config"
import {
  buildSubscriptionQuickLinksHtml,
  escapeHtml,
} from "@/lib/broker-deep-links"
import { getBrokerLinkPrefs, normalizeBrokerIds } from "@/lib/broker-link-prefs"
import { listSubscriptions } from "@/lib/subscriptions"
import { sendToChannel, sendText } from "@/lib/telegram"
import {
  formatTelegramKstTime,
  formatTelegramPremiumPct,
  getTelegramDigestHeader,
  getTelegramDigestSignalLabel,
  getTelegramPersonalSignalLabel,
  getTelegramPricePremiumLine,
  resolveTelegramLocale,
  type TelegramPersonalSignalType,
} from "@/lib/telegram-i18n"

/** 채널 브로드캐스트용 (공개 채널은 한국어 고정) */
function formatChannelPrice(value: number): string {
  return Math.round(value).toLocaleString("ko-KR")
}

function formatChannelPremium(value: number): string {
  return `${value.toFixed(2)}%`
}

function formatChannelKstTime(date: Date): string {
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
  const kst = formatChannelKstTime(calculatedAt)
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
        `현재가 ${formatChannelPrice(etf.price)} · 괴리율 ${formatChannelPremium(etf.premium)} ${signal}`,
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
  let digestSent = 0

  // 1) KV 구독 (봇에서 ETF/기준 선택한 사용자) — 매수/매도 없어도 홀드라도 1통 전송
  const subscriptions = await listSubscriptions()
  const uniqueChatIds = [...new Set(subscriptions.map((s) => s.chat_id))]
  const localeByTelegramChat = new Map<number, Locale>()
  if (uniqueChatIds.length > 0) {
    const localeRows = await db
      .select({ telegramId: users.telegramId, locale: users.locale })
      .from(users)
      .where(inArray(users.telegramId, uniqueChatIds.map(String)))
    for (const r of localeRows) {
      const id = Number.parseInt(r.telegramId ?? "", 10)
      if (Number.isFinite(id) && r.locale && isValidLocale(r.locale)) {
        localeByTelegramChat.set(id, r.locale)
      }
    }
  }

  const brokerPrefsByChat = new Map<number, string[] | null>()
  for (const cid of uniqueChatIds) {
    brokerPrefsByChat.set(cid, await getBrokerLinkPrefs(cid))
  }

  for (const sub of subscriptions) {
    const etf = etfByTicker.get(sub.etf_ticker)
    if (!etf) {
      continue
    }
    const locale =
      localeByTelegramChat.get(sub.chat_id) ??
      resolveTelegramLocale(sub.locale)
    const buyTrigger = etf.premium <= sub.premium_threshold
    const sellTrigger =
      sub.sell_threshold != null && etf.premium >= sub.sell_threshold
    let personalSignal: TelegramPersonalSignalType
    if (buyTrigger && sellTrigger) {
      personalSignal = "buy_and_sell"
    } else if (buyTrigger) {
      personalSignal = "buy"
    } else if (sellTrigger) {
      personalSignal = "sell"
    } else {
      personalSignal = "hold"
    }
    const signal = getTelegramPersonalSignalLabel(personalSignal, locale)
    const premStr = formatTelegramPremiumPct(etf.premium)
    const line =
      `${escapeHtml(etf.name)}\n` +
      `${getTelegramPricePremiumLine(etf.price, premStr, locale)} ${signal}` +
      buildSubscriptionQuickLinksHtml(
        etf.ticker,
        locale,
        brokerPrefsByChat.get(sub.chat_id) ?? null,
        SITE_URL,
      )
    const res = await sendText(sub.chat_id, line, {
      parseMode: "HTML",
      disableWebPagePreview: true,
    })
    if (res.ok) {
      personalSent += 1
    }
  }

  // 2) DB 연동 사용자 (마이페이지 관심 리스트) — 관심 ETF 일괄 요약 1통만 전송 (신호별 개별 문자는 보내지 않음)
  const linkedUsers = await db
    .select({
      telegramId: users.telegramId,
      preferences: userPreferences.preferences,
      locale: users.locale,
      telegramBrokerLinkIds: userPreferences.telegramBrokerLinkIds,
    })
    .from(users)
    .innerJoin(userPreferences, eq(users.id, userPreferences.userId))
    .where(sql`${users.telegramId} is not null`)

  // 관심 ETF 일괄 요약 1통 전송
  for (const row of linkedUsers) {
    const chatId = Number.parseInt(row.telegramId ?? "", 10)
    if (!Number.isFinite(chatId)) {
      continue
    }
    const locale = resolveTelegramLocale(row.locale)
    const kstTimeStr = formatTelegramKstTime(calculatedAt, locale)
    const dbBrokers = row.telegramBrokerLinkIds
    let brokerPrefsDigest: string[] | null
    if (Array.isArray(dbBrokers) && dbBrokers.every((x) => typeof x === "string")) {
      brokerPrefsDigest = normalizeBrokerIds(dbBrokers)
    } else {
      brokerPrefsDigest = await getBrokerLinkPrefs(chatId)
    }
    const prefs = row.preferences ?? {}
    const digestLines: string[] = [getTelegramDigestHeader(kstTimeStr, locale), ""]
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
      const signal = getTelegramDigestSignalLabel(etf.signal, locale)
      const premStr = formatTelegramPremiumPct(etf.premium)
      digestLines.push(
        `${escapeHtml(etf.name)}\n` +
          `${getTelegramPricePremiumLine(etf.price, premStr, locale)} ${signal}` +
          buildSubscriptionQuickLinksHtml(
            etf.ticker,
            locale,
            brokerPrefsDigest,
            SITE_URL,
          ),
      )
      digestLines.push("")
    }
    if (digestLines.length <= 2) {
      continue
    }
    const digestText = digestLines.join("\n").trimEnd()
    const res = await sendText(chatId, digestText, {
      parseMode: "HTML",
      disableWebPagePreview: true,
    })
    if (res.ok) {
      digestSent += 1
    }
  }

  return NextResponse.json({
    ok: true,
    sent: 1,
    personalSent,
    digestSent,
  })
}
