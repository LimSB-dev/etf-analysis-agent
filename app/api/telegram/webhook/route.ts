/**
 * Telegram Bot Webhook (POST)
 * - /start: 환영·안내( /help )만, ETF 키보드 없음
 * - /subscribe · /구독추가: ETF 선택 후 매수·매도 기준 한 화면(subsave)에서 저장
 * - /start <token>: 마이페이지에서 발급한 토큰으로 관심 리스트 구독 동기화 후 안내(증권사 키보드는 자동 표시하지 않음; /brokers)
 * - ETF 선택 시: 매수·매도 동시 선택 Keyboard (기존 thresh/sell 콜백은 예전 메시지 호환용 유지)
 * - /brokers (또는 /증권사): 증권사 선택 화면만 다시 표시
 * - /help (또는 /도움): 사용 가능한 기능 안내
 * - /premium · /괴리율 · /now · /실시간: 현재 시점 괴리율·신호 스냅샷(캐시)
 *
 * Vercel 배포 후 Telegram에 Webhook URL 설정 필요:
 * https://api.telegram.org/bot<TOKEN>/setWebhook?url=<YOUR_VERCEL_URL>/api/telegram/webhook
 */

import { NextRequest, NextResponse } from "next/server"
import { eq, and, gt } from "drizzle-orm"
import { ETFS } from "@/lib/constants/etfs"
import { ETF_OPTIONS } from "@/lib/etf-options"
import { db } from "@/lib/db"
import { userPreferences, telegramLinkTokens, users } from "@/lib/db/schema"
import { BROKER_DEEP_LINK_IDS, escapeHtml } from "@/lib/broker-deep-links"
import {
  clearPendingBrokerSel,
  getBrokerLinkPrefs,
  getPendingBrokerSel,
  setBrokerLinkPrefs,
  setPendingBrokerSel,
} from "@/lib/broker-link-prefs"
import { isValidLocale } from "@/lib/i18n/config"
import { SITE_URL, TELEGRAM_CHANNEL_URL } from "@/lib/site-config"
import {
  getSubscribedTickersForTelegramChat,
  mergeKvOnlySubscriptionsIntoUserPreferences,
  upsertUserPreferenceFromTelegramSubscription,
} from "@/lib/telegram-db-preferences-sync"
import { addSubscription } from "@/lib/subscriptions"
import {
  buildTelegramHelpHtml,
  buildTelegramPremiumSnapshotHtml,
  buildTelegramSubscribedPremiumSnapshotHtml,
  normalizeTelegramCommand,
} from "@/lib/telegram-help"
import { resolveTelegramLocale } from "@/lib/telegram-i18n"
import {
  brokerPromptHtml,
  buildBrokerPickKeyboard,
  toggleBrokerSelection,
} from "@/lib/telegram-broker-prompt"
import {
  answerCallbackQuery,
  editMessageTextWithKeyboard,
  sendMessageWithKeyboard,
  sendText,
  type InlineKeyboardButtonType,
} from "@/lib/telegram"

/** 매수 기준 옵션 (% 이하 시 매수 알림) */
const PREMIUM_THRESHOLDS = [-1, -1.5, -2] as const

/** 매도 기준 옵션 (% 이상 시 매도 알림, 선택 사항) */
const SELL_THRESHOLDS = [1, 1.5, 2] as const

const DEFAULT_BUY_THRESHOLD = -1
const DEFAULT_SELL_THRESHOLD = 1

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
    message?: { chat: { id: number }; message_id?: number }
    data?: string
  }
}

async function getDbLocaleForTelegramChat(
  chatId: number,
): Promise<string | undefined> {
  const rows = await db
    .select({ locale: users.locale })
    .from(users)
    .where(eq(users.telegramId, String(chatId)))
    .limit(1)
  const l = rows[0]?.locale
  return l && isValidLocale(l) ? l : undefined
}

async function sendBrokerPickerPrompt(chatId: number): Promise<void> {
  const locRaw = await getDbLocaleForTelegramChat(chatId)
  const loc = locRaw === "en" ? "en" : "ko"
  const existing = await getBrokerLinkPrefs(chatId)
  const initial = existing ?? []
  await setPendingBrokerSel(chatId, initial)
  await sendMessageWithKeyboard(
    chatId,
    brokerPromptHtml(initial, loc),
    buildBrokerPickKeyboard(initial, loc),
    "HTML",
  )
}

async function sendSubscriptionCompleteWithBrokerKeyboard(
  chatId: number,
  etfName: string,
  sellTextPlain: string,
  preferencesSyncedToWeb: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const locRaw = await getDbLocaleForTelegramChat(chatId)
  const loc = locRaw === "en" ? "en" : "ko"
  const existing = await getBrokerLinkPrefs(chatId)
  const initial = existing ?? []
  await setPendingBrokerSel(chatId, initial)
  const scheduleKo =
    "매일 평일 15:00에 조건을 확인해, 장 마감(15:30) 전에 알림을 보냅니다."
  const scheduleEn =
    "We check on weekdays at 15:00 KST and send alerts before the close (15:30)."
  const schedule = loc === "en" ? scheduleEn : scheduleKo
  const noteKo = preferencesSyncedToWeb
    ? "※ 같은 기준이 <b>마이페이지 관심 ETF</b>에도 저장되었습니다. 봇에서는 <code>/subs</code> · <code>/my</code>로 확인할 수 있어요."
    : "※ 웹 계정과 텔레그램을 연결하면 마이페이지 관심 ETF에도 같이 저장됩니다. 연결 전까지는 봇(<code>/subs</code>)에서만 확인할 수 있어요."
  const noteEn = preferencesSyncedToWeb
    ? "These thresholds were also saved to your <b>website watchlist</b>. Use <code>/subs</code> or <code>/my</code> in the bot."
    : "Link Telegram from <b>My page</b> to also save subscriptions to your web watchlist. Until then, use <code>/subs</code> in the bot."
  const doneTitle =
    loc === "en" ? "✅ Subscription complete" : "✅ 구독이 완료되었습니다"
  const html =
    `${doneTitle}\n\n` +
    `<b>ETF:</b> ${escapeHtml(etfName)}\n` +
    `${escapeHtml(sellTextPlain)}\n\n` +
    `${schedule}\n\n` +
    `<i>${note}</i>\n\n` +
    `—\n\n` +
    brokerPromptHtml(initial, loc)
  return sendMessageWithKeyboard(
    chatId,
    html,
    buildBrokerPickKeyboard(initial, loc),
    "HTML",
  )
}

async function getDbLocaleForUserId(
  userId: string,
): Promise<string | undefined> {
  const rows = await db
    .select({ locale: users.locale })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  const l = rows[0]?.locale
  return l && isValidLocale(l) ? l : undefined
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

function buildSubscribedEtfKeyboard(tickers: string[]): InlineKeyboardButtonType[][] {
  const uniq = [...new Set(tickers)]
  return uniq.map((t) => {
    const name = ETFS.find((e) => e.ticker === t)?.name ?? t
    return [{ text: name, callback_data: `subetf:${t}` }]
  })
}

// NOTE: 이전 버전에서 사용하던 subsave(한 화면 기준 선택) 콜백을 위해 남겨둔 헬퍼였습니다.
// 현재는 ETF 선택 즉시 기본값(-1%, +1%)으로 저장하고, 상세 설정은 웹에서 진행합니다.

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

  const plainMessageText = update.message?.text?.trim() ?? ""
  const messageCommand = normalizeTelegramCommand(plainMessageText)
  if (update.message && !update.callback_query) {
    if (
      messageCommand === "/commands" ||
      messageCommand === "/명령어" ||
      messageCommand === "/menu"
    ) {
      const locRaw = await getDbLocaleForTelegramChat(chatId)
      const locale = resolveTelegramLocale(locRaw)
      const html = buildTelegramHelpHtml(locale, SITE_URL, TELEGRAM_CHANNEL_URL)
      await sendText(chatId, html, {
        parseMode: "HTML",
        disableWebPagePreview: true,
      })
      return NextResponse.json({ ok: true })
    }

    if (
      messageCommand === "/brokers" ||
      messageCommand === "/증권사" ||
      messageCommand === "/broker"
    ) {
      await sendBrokerPickerPrompt(chatId)
      return NextResponse.json({ ok: true })
    }

    if (messageCommand === "/subscribe" || messageCommand === "/구독추가") {
      const sent = await sendMessageWithKeyboard(
        chatId,
        `알림 받을 ETF를 선택하세요.\n` +
          `선택하면 기본값(매수 ${DEFAULT_BUY_THRESHOLD}%, 매도 +${DEFAULT_SELL_THRESHOLD}%)으로 바로 구독됩니다.\n` +
          `기준 조정은 웹 마이페이지에서 진행해 주세요.\n\n` +
          `💡 /help — 전체 안내 · /premium — 지금 괴리율`,
        buildEtfKeyboard(),
      )
      if (!sent.ok) {
        console.error("[telegram:webhook] /subscribe send failed", {
          chatId,
          error: sent.error ?? "unknown",
        })
      }
      return NextResponse.json({ ok: sent.ok })
    }

    if (messageCommand === "/help" || messageCommand === "/도움") {
      const locRaw = await getDbLocaleForTelegramChat(chatId)
      const locale = resolveTelegramLocale(locRaw)
      const html = buildTelegramHelpHtml(locale, SITE_URL, TELEGRAM_CHANNEL_URL)
      await sendText(chatId, html, {
        parseMode: "HTML",
        disableWebPagePreview: true,
      })
      return NextResponse.json({ ok: true })
    }

    if (
      messageCommand === "/subs" ||
      messageCommand === "/my" ||
      messageCommand === "/구독" ||
      messageCommand === "/내구독"
    ) {
      const locRaw = await getDbLocaleForTelegramChat(chatId)
      const locale = resolveTelegramLocale(locRaw)
      const tickers = await getSubscribedTickersForTelegramChat(chatId)
      const snap = await buildTelegramSubscribedPremiumSnapshotHtml(locale, tickers)
      await sendText(
        chatId,
        snap.ok ? snap.html : snap.message,
        snap.ok
          ? { parseMode: "HTML", disableWebPagePreview: true }
          : "HTML",
      )
      return NextResponse.json({ ok: true })
    }

    if (
      messageCommand === "/edit" ||
      messageCommand === "/구독수정" ||
      messageCommand === "/수정" ||
      messageCommand === "/update"
    ) {
      const base = SITE_URL.replace(/\/$/, "")
      const msg =
        `구독 기준(매수·매도 %) 수정은 웹 마이페이지에서 진행해 주세요.\n\n` +
        `➡️ ${base}/mypage`
      await sendText(chatId, msg)
      return NextResponse.json({ ok: true })
    }

    if (
      messageCommand === "/premium" ||
      messageCommand === "/괴리율" ||
      messageCommand === "/now" ||
      messageCommand === "/실시간"
    ) {
      const locRaw = await getDbLocaleForTelegramChat(chatId)
      const locale = resolveTelegramLocale(locRaw)
      const snap = await buildTelegramPremiumSnapshotHtml(locale)
      if (snap.ok) {
        await sendText(chatId, snap.html, {
          parseMode: "HTML",
          disableWebPagePreview: true,
        })
      } else {
        await sendText(chatId, snap.message)
      }
      return NextResponse.json({ ok: true })
    }
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
        await mergeKvOnlySubscriptionsIntoUserPreferences({
          userId: linkRow.userId,
          chatId,
        })

        const prefRow = await db
          .select({ preferences: userPreferences.preferences })
          .from(userPreferences)
          .where(eq(userPreferences.userId, linkRow.userId))
          .limit(1)
          .then((rows) => rows[0] ?? null)

        const prefs = prefRow?.preferences ?? {}
        const linkedLocale = await getDbLocaleForUserId(linkRow.userId)
        let synced = 0
        for (const [etfId, p] of Object.entries(prefs)) {
          const ticker = ETF_OPTIONS.find((o) => o.id === etfId)?.code ?? null
          if (!ticker || !ETFS.some((e) => e.ticker === ticker) || !p) {
            continue
          }
          const buy = p.buyPremiumThreshold ?? -1
          const sellTh =
            p.sellPremiumThreshold == null
              ? undefined
              : p.sellPremiumThreshold
          const added = await addSubscription({
            chat_id: chatId,
            etf_ticker: ticker,
            premium_threshold: buy,
            ...(sellTh != null ? { sell_threshold: sellTh } : {}),
            ...(linkedLocale ? { locale: linkedLocale } : {}),
          })
          if (added) {
            synced += 1
          }
        }

        await db
          .update(users)
          .set({ telegramId: String(chatId) })
          .where(eq(users.id, linkRow.userId))

        await db
          .delete(telegramLinkTokens)
          .where(eq(telegramLinkTokens.token, tokenPayload))

        const head =
          synced > 0
            ? `✅ 연결되었습니다.\n\n관심 리스트 ${synced}개 ETF에 대해 매수·매도 기준대로 알림을 보내드립니다.\n매일 평일 15:00(KST)에 조건을 확인해, 장 마감(15:30) 전에 알림을 보내드립니다.`
            : `✅ 연결되었습니다.\n\n관심 리스트에 ETF를 추가한 뒤 마이페이지에서 매수·매도 기준을 설정하고 저장하면, 해당 설정대로 알림을 보내드립니다.`
        const tail =
          `\n\n` +
          `이 봇은 ETF 괴리율(프리미엄) 알림을 보내는 서비스입니다.\n` +
          `전체 명령·이용 방법은 <b>/help</b> 를 눌러 보세요.\n` +
          `알림에 넣을 네이버·토스·증권사 바로가기는 필요할 때 <b>/brokers</b> 로 설정하면 됩니다.\n\n` +
          `💡 <b>/subscribe</b> — 봇에서 ETF 구독 추가 · <b>/premium</b> — 지금 괴리율`
        const sent = await sendText(chatId, `${escapeHtml(head)}${tail}`, {
          parseMode: "HTML",
          disableWebPagePreview: true,
        })
        if (!sent.ok) {
          console.error("[telegram:webhook] /start <token> send failed", {
            chatId,
            error: sent.error ?? "unknown",
          })
        }
        return NextResponse.json({ ok: sent.ok })
      }
    }

    const welcome =
      `${escapeHtml("안녕하세요! ETF 괴리율(프리미엄) 알림 봇입니다.")}\n\n` +
      `평일 알림·구독·웹 연동 방법은 <b>/help</b> 에 정리되어 있어요.\n` +
      `봇에서 ETF만 골라 구독하려면 <b>/subscribe</b> 를 입력해 주세요.\n\n` +
      `💡 <b>/premium</b> — 지금 괴리율 스냅샷`
    const sent = await sendText(chatId, welcome, {
      parseMode: "HTML",
      disableWebPagePreview: true,
    })
    if (!sent.ok) {
      console.error("[telegram:webhook] /start send failed", {
        chatId,
        error: sent.error ?? "unknown",
      })
    }
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

  // 빠른 이동(네이버·토스·증권사 앱) 최대 5개까지 다중 선택
  if (data.startsWith("brk:")) {
    const msgId = update.callback_query?.message?.message_id
    if (msgId == null) {
      return NextResponse.json({ ok: true })
    }
    const locRaw = await getDbLocaleForTelegramChat(chatId)
    const loc = locRaw === "en" ? "en" : "ko"

    if (data === "brk:done") {
      let sel = await getPendingBrokerSel(chatId)
      if (sel == null) {
        sel = (await getBrokerLinkPrefs(chatId)) ?? []
      }
      await setBrokerLinkPrefs(chatId, sel)
      await clearPendingBrokerSel(chatId)
      await sendText(
        chatId,
        loc === "en"
          ? "✅ Saved. Your selected broker deep links will appear in alerts."
          : "✅ 저장했습니다. 알림에 선택한 증권사 딥링크가 포함됩니다.",
      )
      return NextResponse.json({ ok: true })
    }

    if (data === "brk:skip") {
      await setBrokerLinkPrefs(chatId, [])
      await clearPendingBrokerSel(chatId)
      await sendText(
        chatId,
        loc === "en"
          ? "✅ Saved. No quick links will be added to alerts."
          : "✅ 저장했습니다. 빠른 이동 링크는 알림에 넣지 않습니다.",
      )
      return NextResponse.json({ ok: true })
    }

    if (data.startsWith("brk:t:")) {
      const id = data.slice(6)
      if (!BROKER_DEEP_LINK_IDS.includes(id)) {
        return NextResponse.json({ ok: true })
      }
      let sel = await getPendingBrokerSel(chatId)
      if (sel == null) {
        sel = (await getBrokerLinkPrefs(chatId)) ?? []
      }
      const next = toggleBrokerSelection(sel, id)
      await setPendingBrokerSel(chatId, next)
      await editMessageTextWithKeyboard(
        chatId,
        msgId,
        brokerPromptHtml(next, loc),
        buildBrokerPickKeyboard(next, loc),
        "HTML",
      )
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  }

  // ETF 선택: etf:{ticker}
  if (data.startsWith("etf:")) {
    const ticker = data.slice(4)
    const etf = ETFS.find((e) => e.ticker === ticker)
    if (!etf) {
      await sendText(chatId, "선택한 ETF를 찾을 수 없습니다.")
      return NextResponse.json({ ok: true })
    }

    const localeFromDb = await getDbLocaleForTelegramChat(chatId)
    const added = await addSubscription({
      chat_id: chatId,
      etf_ticker: etf.ticker,
      premium_threshold: DEFAULT_BUY_THRESHOLD,
      sell_threshold: DEFAULT_SELL_THRESHOLD,
      ...(localeFromDb ? { locale: localeFromDb } : {}),
    })
    if (!added) {
      await sendText(chatId, "구독 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.")
      return NextResponse.json({ ok: true })
    }

    const { synced: preferencesSyncedToWeb } =
      await upsertUserPreferenceFromTelegramSubscription({
        chatId,
        etfTicker: etf.ticker,
        buyPremiumThreshold: DEFAULT_BUY_THRESHOLD,
        sellThreshold: DEFAULT_SELL_THRESHOLD,
      })

    const base = SITE_URL.replace(/\/$/, "")
    const noteKo = preferencesSyncedToWeb
      ? `✅ 구독 완료: <b>${escapeHtml(etf.name)}</b>\n` +
        `매수 ${DEFAULT_BUY_THRESHOLD}% 이하 · 매도 +${DEFAULT_SELL_THRESHOLD}% 이상\n\n` +
        `같은 설정이 웹 마이페이지에도 저장되었습니다.\n` +
        `기준을 바꾸려면 웹에서 수정해 주세요: ${escapeHtml(`${base}/mypage`)}`
      : `✅ 구독 완료: <b>${escapeHtml(etf.name)}</b>\n` +
        `매수 ${DEFAULT_BUY_THRESHOLD}% 이하 · 매도 +${DEFAULT_SELL_THRESHOLD}% 이상\n\n` +
        `웹(마이페이지)에서 텔레그램을 연결하면, 구독이 웹에도 같이 저장됩니다.\n` +
        `기준을 바꾸려면 웹에서 수정해 주세요: ${escapeHtml(`${base}/mypage`)}`

    const sent = await sendText(chatId, noteKo, {
      parseMode: "HTML",
      disableWebPagePreview: true,
    })
    if (!sent.ok) {
      console.error("[telegram:webhook] etf default subscribe notify failed", {
        chatId,
        error: sent.error ?? "unknown",
        ticker,
      })
    }
    return NextResponse.json({ ok: sent.ok })
  }

  // 구독 ETF 선택(수정): subetf:{ticker}
  if (data.startsWith("subetf:")) {
    const ticker = data.slice(7)
    const etf = ETFS.find((e) => e.ticker === ticker)
    if (!etf) {
      await sendText(chatId, "선택한 ETF를 찾을 수 없습니다. /subs 로 구독을 확인해 주세요.")
      return NextResponse.json({ ok: true })
    }
    const base = SITE_URL.replace(/\/$/, "")
    await sendText(
      chatId,
      `구독 기준 수정은 웹 마이페이지에서 진행해 주세요.\n\n➡️ ${base}/mypage`,
    )
    return NextResponse.json({ ok: true })
  }

  // subsave:* 는 더 이상 사용하지 않음 (ETF 선택 즉시 기본값으로 저장)

  // 매수 기준 선택: thresh:{값}:{ticker} (구 인라인 메시지 호환)
  if (data.startsWith("thresh:")) {
    const parts = data.slice(7).split(":")
    const value = parts[0]
    const ticker = parts[1]
    const threshold = Number.parseFloat(value)
    if (!Number.isFinite(threshold) || !PREMIUM_THRESHOLDS.includes(threshold as -1 | -1.5 | -2)) {
      await sendText(chatId, "잘못된 선택입니다. /subscribe 로 다시 시도해 주세요.")
      return NextResponse.json({ ok: true })
    }
    const etf = ticker ? ETFS.find((e) => e.ticker === ticker) : null
    if (!etf) {
      await sendText(chatId, "선택한 ETF를 찾을 수 없습니다. /subscribe 로 다시 시도해 주세요.")
      return NextResponse.json({ ok: true })
    }

    const localeFromDb = await getDbLocaleForTelegramChat(chatId)
    const added = await addSubscription({
      chat_id: chatId,
      etf_ticker: etf.ticker,
      premium_threshold: threshold,
      ...(localeFromDb ? { locale: localeFromDb } : {}),
    })
    if (!added) {
      const r = await sendText(
        chatId,
        "구독 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      )
      if (!r.ok) {
        console.error("[telegram:webhook] thresh add failed + notify failed", {
          chatId,
          error: r.error ?? "unknown",
        })
      }
      return NextResponse.json({ ok: true })
    }

    const sent = await sendMessageWithKeyboard(
      chatId,
      "괴리율이 선택한 값 이상으로 올라가면 매도 알림을 보냅니다.\n매도 알림도 받으시겠어요?",
      buildSellThresholdKeyboard(threshold, etf.ticker),
    )
    if (!sent.ok) {
      console.error("[telegram:webhook] sell keyboard send failed", {
        chatId,
        error: sent.error ?? "unknown",
      })
    }
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
      await sendText(chatId, "오류가 발생했습니다. /subscribe 로 다시 시도해 주세요.")
      return NextResponse.json({ ok: true })
    }

    let sellThreshold: number | undefined
    if (sellValue !== "none") {
      const n = Number.parseFloat(sellValue)
      if (Number.isFinite(n) && SELL_THRESHOLDS.includes(n as 1 | 1.5 | 2)) {
        sellThreshold = n
      }
    }

    const localeFromDb = await getDbLocaleForTelegramChat(chatId)
    const added = await addSubscription({
      chat_id: chatId,
      etf_ticker: etf.ticker,
      premium_threshold: buyThreshold,
      sell_threshold: sellThreshold,
      ...(localeFromDb ? { locale: localeFromDb } : {}),
    })
    if (!added) {
      const r = await sendText(
        chatId,
        "구독 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      )
      if (!r.ok) {
        console.error("[telegram:webhook] sell add failed + notify failed", {
          chatId,
          error: r.error ?? "unknown",
        })
      }
      return NextResponse.json({ ok: true })
    }

    const sellText =
      sellThreshold != null
        ? `매수: ${buyThreshold}% 이하 / 매도: +${sellThreshold}% 이상`
        : `매수: ${buyThreshold}% 이하`
    const { synced: preferencesSyncedToWeb } =
      await upsertUserPreferenceFromTelegramSubscription({
        chatId,
        etfTicker: etf.ticker,
        buyPremiumThreshold: buyThreshold,
        sellThreshold,
      })
    const done = await sendSubscriptionCompleteWithBrokerKeyboard(
      chatId,
      etf.name,
      sellText,
      preferencesSyncedToWeb,
    )
    if (!done.ok) {
      console.error("[telegram:webhook] complete message send failed", {
        chatId,
        error: done.error ?? "unknown",
      })
    }
    return NextResponse.json({ ok: done.ok })
  }

  return NextResponse.json({ ok: true })
}
