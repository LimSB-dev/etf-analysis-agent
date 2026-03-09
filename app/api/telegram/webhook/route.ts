/**
 * Telegram Bot Webhook (POST)
 * - /start: 알림 받을 ETF 선택 Inline Keyboard 전송
 * - /start <token>: 마이페이지에서 발급한 토큰으로 관심 리스트 구독 동기화 후 환영 메시지
 * - ETF 선택 시: 프리미엄 기준 선택 Keyboard 전송
 * - 프리미엄 선택 시: 구독 저장 후 완료 메시지
 *
 * Vercel 배포 후 Telegram에 Webhook URL 설정 필요:
 * https://api.telegram.org/bot<TOKEN>/setWebhook?url=<YOUR_VERCEL_URL>/api/telegram/webhook
 */

import { NextRequest, NextResponse } from "next/server"
import { eq, and, gt } from "drizzle-orm"
import { ETFS } from "@/lib/constants/etfs"
import { ETF_OPTIONS } from "@/lib/etf-options"
import { db } from "@/lib/db"
import { userPreferences, telegramLinkTokens } from "@/lib/db/schema"
import { addSubscription } from "@/lib/subscriptions"
import {
  answerCallbackQuery,
  sendMessageWithKeyboard,
  sendText,
  type InlineKeyboardButtonType,
} from "@/lib/telegram"

/** 매수 기준 옵션 (% 이하 시 매수 알림) */
const PREMIUM_THRESHOLDS = [-1, -1.5, -2] as const

/** 매도 기준 옵션 (% 이상 시 매도 알림, 선택 사항) */
const SELL_THRESHOLDS = [1, 1.5, 2] as const

/** Telegram Update 타입 (필요한 필드만, 채널 포스트 포함) */
interface TelegramUpdateType {
  update_id?: number
  message?: {
    chat: { id: number }
    text?: string
  }
  channel_post?: {
    chat: { id: number }
    text?: string
  }
  callback_query?: {
    id: string
    message?: { chat: { id: number } }
    data?: string
  }
}

function getChatId(update: TelegramUpdateType): number | null {
  if (update.message?.chat?.id != null) {
    return update.message.chat.id
  }
  if (update.channel_post?.chat?.id != null) {
    return update.channel_post.chat.id
  }
  if (update.callback_query?.message?.chat?.id != null) {
    return update.callback_query.message.chat.id
  }
  return null
}

/** 1단계: ETF 선택 Inline Keyboard (한 줄에 1개, 리스트 형태) */
function buildEtfKeyboard(): InlineKeyboardButtonType[][] {
  return ETFS.map((etf, i) => [
    {
      text: `${i + 1}\uFE0F\u20E3 ${etf.name}`,
      callback_data: `etf:${etf.ticker}`,
    },
  ])
}

/** 2단계: 매수 기준 선택 Keyboard */
function buildThresholdKeyboard(ticker: string): InlineKeyboardButtonType[][] {
  return [
    PREMIUM_THRESHOLDS.map((p) => ({
      text: `${p}%`,
      callback_data: `thresh:${p}:${ticker}`,
    })),
  ]
}

/** 3단계: 매도 기준 선택 Keyboard (buyThreshold 포함해 구독 갱신 시 사용) */
function buildSellThresholdKeyboard(
  buyThreshold: number,
  ticker: string,
): InlineKeyboardButtonType[][] {
  const row1 = SELL_THRESHOLDS.map((p) => ({
    text: `+${p}%`,
    callback_data: `sell:${p}:${buyThreshold}:${ticker}`,
  }))
  const row2 = [{ text: "안 함", callback_data: `sell:none:${buyThreshold}:${ticker}` }]
  return [row1, row2]
}

export async function POST(request: NextRequest) {
  let update: TelegramUpdateType
  try {
    update = (await request.json()) as TelegramUpdateType
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const chatId = getChatId(update)
  if (chatId == null) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // /start 또는 /start <token> (개인 채팅만; 채널 포스트는 토큰 없음)
  const startText =
    update.message?.text?.trim() ?? update.channel_post?.text?.trim() ?? ""
  const isStartCommand = startText === "/start" || startText.startsWith("/start ")
  if (isStartCommand) {
    const tokenPayload = startText.startsWith("/start ")
      ? startText.slice(7).trim()
      : ""

    if (tokenPayload && update.message?.chat?.id != null) {
      const linkRow = await db
        .select({ userId: telegramLinkTokens.userId })
        .from(telegramLinkTokens)
        .where(
          and(
            eq(telegramLinkTokens.token, tokenPayload),
            gt(telegramLinkTokens.expiresAt, new Date()),
          ),
        )
        .limit(1)
        .then((rows) => rows[0] ?? null)

      if (linkRow) {
        const prefRow = await db
          .select({ preferences: userPreferences.preferences })
          .from(userPreferences)
          .where(eq(userPreferences.userId, linkRow.userId))
          .limit(1)
          .then((rows) => rows[0] ?? null)

        const prefs = prefRow?.preferences ?? {}
        let synced = 0
        for (const [etfId, p] of Object.entries(prefs)) {
          const ticker = ETF_OPTIONS.find((o) => o.id === etfId)?.code ?? null
          if (!ticker || !ETFS.some((e) => e.ticker === ticker) || !p) {
            continue
          }
          const buy = p.buyPremiumThreshold ?? -1
          const sell = p.sellPremiumThreshold ?? 1
          const added = await addSubscription({
            chat_id: chatId,
            etf_ticker: ticker,
            premium_threshold: buy,
            sell_threshold: sell,
          })
          if (added) {
            synced += 1
          }
        }

        await db
          .delete(telegramLinkTokens)
          .where(eq(telegramLinkTokens.token, tokenPayload))

        const welcomeMsg =
          synced > 0
            ? `✅ 연결되었습니다.\n\n관심 리스트 ${synced}개 ETF에 대해 매수·매도 기준대로 알림을 보내드립니다.\n매일 평일 09:30(KST)에 조건을 확인합니다.`
            : "✅ 연결되었습니다.\n관심 리스트에 ETF를 추가한 뒤 마이페이지에서 매수·매도 기준을 설정하고 저장하면, 해당 설정대로 알림을 보내드립니다."
        const sent = await sendText(chatId, welcomeMsg)
        return NextResponse.json({ ok: sent.ok })
      }
    }

    const sent = await sendMessageWithKeyboard(
      chatId,
      "알림 받을 ETF를 선택하세요.",
      buildEtfKeyboard(),
    )
    return NextResponse.json({ ok: sent.ok })
  }

  // Inline 버튼 클릭 (callback_query)
  const callbackQueryId = update.callback_query?.id
  const data = update.callback_query?.data
  if (!data) {
    return NextResponse.json({ ok: true })
  }
  if (callbackQueryId) {
    await answerCallbackQuery(callbackQueryId)
  }

  // ETF 선택: etf:{ticker}
  if (data.startsWith("etf:")) {
    const ticker = data.slice(4)
    const etf = ETFS.find((e) => e.ticker === ticker)
    if (!etf) {
      await sendText(chatId, "선택한 ETF를 찾을 수 없습니다.")
      return NextResponse.json({ ok: true })
    }
    const sent = await sendMessageWithKeyboard(
      chatId,
      "괴리율이 선택한 값 이하로 내려가면 매수 알림을 보냅니다.\n프리미엄 기준을 선택하세요.",
      buildThresholdKeyboard(etf.ticker),
    )
    return NextResponse.json({ ok: sent.ok })
  }

  // 매수 기준 선택: thresh:{값}:{ticker}
  if (data.startsWith("thresh:")) {
    const parts = data.slice(7).split(":")
    const value = parts[0]
    const ticker = parts[1]
    const threshold = Number.parseFloat(value)
    if (!Number.isFinite(threshold) || !PREMIUM_THRESHOLDS.includes(threshold as -1 | -1.5 | -2)) {
      await sendText(chatId, "잘못된 선택입니다. /start 로 다시 시작해 주세요.")
      return NextResponse.json({ ok: true })
    }
    const etf = ticker ? ETFS.find((e) => e.ticker === ticker) : null
    if (!etf) {
      await sendText(chatId, "선택한 ETF를 찾을 수 없습니다. /start 로 다시 시작해 주세요.")
      return NextResponse.json({ ok: true })
    }

    const added = await addSubscription({
      chat_id: chatId,
      etf_ticker: etf.ticker,
      premium_threshold: threshold,
    })
    if (!added) {
      await sendText(chatId, "구독 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.")
      return NextResponse.json({ ok: true })
    }

    const sent = await sendMessageWithKeyboard(
      chatId,
      "괴리율이 선택한 값 이상으로 올라가면 매도 알림을 보냅니다.\n매도 알림도 받으시겠어요?",
      buildSellThresholdKeyboard(threshold, etf.ticker),
    )
    return NextResponse.json({ ok: sent.ok })
  }

  // 매도 기준 선택: sell:{+1|+1.5|+2|none}:{매수기준}:{ticker}
  if (data.startsWith("sell:")) {
    const parts = data.slice(5).split(":")
    const sellValue = parts[0]
    const buyThreshold = Number.parseFloat(parts[1])
    const ticker = parts[2]
    const etf = ticker ? ETFS.find((e) => e.ticker === ticker) : null
    if (!etf || !Number.isFinite(buyThreshold)) {
      await sendText(chatId, "오류가 발생했습니다. /start 로 다시 시작해 주세요.")
      return NextResponse.json({ ok: true })
    }

    let sellThreshold: number | undefined
    if (sellValue !== "none") {
      const n = Number.parseFloat(sellValue)
      if (Number.isFinite(n) && SELL_THRESHOLDS.includes(n as 1 | 1.5 | 2)) {
        sellThreshold = n
      }
    }

    const added = await addSubscription({
      chat_id: chatId,
      etf_ticker: etf.ticker,
      premium_threshold: buyThreshold,
      sell_threshold: sellThreshold,
    })
    if (!added) {
      await sendText(chatId, "구독 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.")
      return NextResponse.json({ ok: true })
    }

    const sellText =
      sellThreshold != null
        ? `매수: ${buyThreshold}% 이하 / 매도: +${sellThreshold}% 이상`
        : `매수: ${buyThreshold}% 이하`
    await sendText(
      chatId,
      `✅ 구독이 완료되었습니다.\n\n` +
        `ETF: ${etf.name}\n` +
        `${sellText}\n\n` +
        `매일 평일 09:30에 조건을 확인해 알림을 보냅니다.`,
    )
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}
