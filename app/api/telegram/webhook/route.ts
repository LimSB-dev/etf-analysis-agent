/**
 * Telegram Bot Webhook (POST)
 * - /start: 알림 받을 ETF 선택 Inline Keyboard 전송
 * - ETF 선택 시: 프리미엄 기준 선택 Keyboard 전송
 * - 프리미엄 선택 시: 구독 저장 후 완료 메시지
 *
 * Vercel 배포 후 Telegram에 Webhook URL 설정 필요:
 * https://api.telegram.org/bot<TOKEN>/setWebhook?url=<YOUR_VERCEL_URL>/api/telegram/webhook
 */

import { NextRequest, NextResponse } from "next/server"
import { ETFS } from "@/lib/constants/etfs"
import {
  addSubscription,
  clearTelegramState,
  getTelegramState,
  setTelegramState,
} from "@/lib/subscriptions"
import {
  answerCallbackQuery,
  sendMessageWithKeyboard,
  sendText,
  type InlineKeyboardButtonType,
} from "@/lib/telegram"

/** 프리미엄 기준 옵션 (% 값) */
const PREMIUM_THRESHOLDS = [-1, -1.5, -2] as const

/** Telegram Update 타입 (필요한 필드만) */
interface TelegramUpdateType {
  update_id?: number
  message?: {
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

/** 2단계: 프리미엄 기준 선택 Keyboard */
function buildThresholdKeyboard(): InlineKeyboardButtonType[][] {
  return [
    PREMIUM_THRESHOLDS.map((p) => ({
      text: `${p}%`,
      callback_data: `thresh:${p}`,
    })),
  ]
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

  // /start 또는 일반 메시지 → ETF 선택 화면
  if (update.message?.text === "/start") {
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
    await setTelegramState(chatId, {
      step: 2,
      selected_ticker: etf.ticker,
      selected_name: etf.name,
    })
    const sent = await sendMessageWithKeyboard(
      chatId,
      "괴리율이 선택한 값 이하로 내려가면 매수 알림을 보냅니다.\n프리미엄 기준을 선택하세요.",
      buildThresholdKeyboard(),
    )
    return NextResponse.json({ ok: sent.ok })
  }

  // 프리미엄 기준 선택: thresh:{-1|-1.5|-2}
  if (data.startsWith("thresh:")) {
    const value = data.slice(7)
    const threshold = Number.parseFloat(value)
    if (!Number.isFinite(threshold) || !PREMIUM_THRESHOLDS.includes(threshold as -1 | -1.5 | -2)) {
      await sendText(chatId, "잘못된 선택입니다. /start 로 다시 시작해 주세요.")
      return NextResponse.json({ ok: true })
    }

    const state = await getTelegramState(chatId)
    if (!state || state.step !== 2) {
      await sendText(chatId, "세션이 만료되었습니다. /start 로 다시 시작해 주세요.")
      return NextResponse.json({ ok: true })
    }

    const added = await addSubscription({
      chat_id: chatId,
      etf_ticker: state.selected_ticker,
      premium_threshold: threshold,
    })
    await clearTelegramState(chatId)

    if (added) {
      await sendText(
        chatId,
        `✅ 구독이 완료되었습니다.\n\n` +
          `ETF: ${state.selected_name}\n` +
          `괴리율 기준: ${threshold}% 이하 시 매수 알림\n\n` +
          `매일 평일 09:30에 조건을 확인해 알림을 보냅니다.`,
      )
    } else {
      await sendText(chatId, "구독 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.")
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}
