/**
 * 텔레그램 봇 /help 본문 및 실시간 괴리율 스냅샷 (Webhook 전용, HTML parse_mode)
 */

import { escapeHtml } from "@/lib/broker-deep-links"
import { buildSubscriptionQuickLinksHtml } from "@/lib/broker-deep-links"
import { getEtfList } from "@/lib/getEtfList"
import type { Locale } from "@/lib/i18n/config"
import {
  formatTelegramKstTime,
  formatTelegramPremiumPct,
  getTelegramDigestSignalLabel,
  getTelegramPricePremiumLine,
} from "@/lib/telegram-i18n"

/** 그룹 채팅 등에서 /cmd@BotName 형태 정규화 */
export function normalizeTelegramCommand(raw: string): string {
  const first = raw.trim().split(/\s+/)[0] ?? ""
  const at = first.indexOf("@")
  return at > 0 ? first.slice(0, at) : first
}

function baseUrl(siteUrl: string): string {
  return siteUrl.replace(/\/$/, "")
}

export function buildTelegramHelpHtml(
  locale: Locale,
  siteUrl: string,
  channelUrl: string,
): string {
  const base = baseUrl(siteUrl)
  const webLink = `${base}/`
  const mypageLink = `${base}/mypage`
  if (locale === "en") {
    return (
      `<b>📖 ETF alert bot — Help</b>\n\n` +
      `<b>Realtime premium</b>\n` +
      `<code>/premium</code> · <code>/now</code> — snapshot of premium and BUY/SELL/HOLD signals (cached ~30s).\n` +
      `<code>/my</code> · <code>/subs</code> — snapshot for your subscribed tickers only.\n` +
      `Full iNAV calculator &amp; charts: <a href="${escapeHtml(webLink)}">website</a>\n\n` +
      `<b>Change what this bot alerts (subscription)</b>\n` +
      `<code>/start</code> — welcome only (see <code>/help</code>).\n` +
      `<code>/subscribe</code> — pick an ETF to subscribe instantly with defaults (buy -1%, sell +1%).\n` +
      `<code>/edit</code> — manage thresholds on <a href="${escapeHtml(mypageLink)}">My page</a>.\n` +
      `If Telegram is linked from <a href="${escapeHtml(mypageLink)}">My page</a>, subscriptions are also saved to your <b>website watchlist</b>.\n\n` +
      `<b>Quick links in alerts</b>\n` +
      `<code>/brokers</code> — Naver, Toss, and broker apps (up to 5 total, same as web when linked).\n\n` +
      `<b>Public summary channel</b>\n` +
      `Daily broadcast for all tickers: <a href="${escapeHtml(channelUrl)}">join channel</a>\n` +
      `(To switch channels, join/leave in Telegram as you prefer.)\n\n` +
      `<b>This message</b>\n` +
      `<code>/help</code>`
    )
  }
  return (
    `<b>📖 ETF 괴리율 알림 봇 — 도움말</b>\n\n` +
    `<b>실시간 괴리율 보기</b>\n` +
    `<code>/premium</code> · <code>/괴리율</code> · <code>/now</code> · <code>/실시간</code> — 지금 기준 ETF별 괴리율·매매 신호(약 30초 캐시).\n` +
    `<code>/my</code> · <code>/subs</code> · <code>/구독</code> — 내가 구독한 ETF만 괴리율·신호를 확인합니다.\n` +
    `iNAV·차트 등 자세한 분석: <a href="${escapeHtml(webLink)}">웹사이트</a>\n\n` +
    `<b>구독(알림) ETF·기준 바꾸기</b>\n` +
    `<code>/start</code> — 환영 안내만 합니다. 전체 명령·링크는 <code>/help</code>를 눌러 보세요.\n` +
    `<code>/subscribe</code> · <code>/구독추가</code> — ETF를 누르면 기본값(매수 -1%, 매도 +1%)으로 바로 구독됩니다.\n` +
    `<code>/edit</code> · <code>/구독수정</code> — 기준(%) 수정은 웹 <a href="${escapeHtml(mypageLink)}">마이페이지</a>에서 진행해 주세요.\n` +
    `마이페이지에서 텔레그램을 연결해 두면, 텔레그램에서 구독한 ETF도 <b>관심 ETF(DB)</b>에 같이 저장됩니다.\n\n` +
    `<b>빠른 이동 링크(네이버·토스·증권사)</b>\n` +
    `<code>/brokers</code> · <code>/증권사</code> — 알림에 넣을 링크를 최대 5개까지 선택. 마이페이지에서도 같이 설정할 수 있어요.\n\n` +
    `<b>공개 알림 채널</b>\n` +
    `전체 ETF 요약 방송: <a href="${escapeHtml(channelUrl)}">채널 참여</a>\n` +
    `(다른 채널로 옮기려면 텔레그램에서 원하는 채널을 구독·알림 설정하면 됩니다.)\n\n` +
    `<b>도움말 다시 보기</b>\n` +
    `<code>/help</code> · <code>/도움</code>`
  )
}

export async function buildTelegramPremiumSnapshotHtml(
  locale: Locale,
): Promise<{ ok: true; html: string } | { ok: false; message: string }> {
  try {
    const etfList = await getEtfList()
    const calculatedAt = new Date()
    const kst = formatTelegramKstTime(calculatedAt, locale)
    const header =
      locale === "en"
        ? `Live premium (${kst} KST)`
        : `실시간 괴리율 (${kst} KST 기준)`
    const lines: string[] = [`<b>${escapeHtml(header)}</b>`, ""]
    for (const etf of etfList) {
      const signal = getTelegramDigestSignalLabel(etf.signal, locale)
      const premStr = formatTelegramPremiumPct(etf.premium)
      const line = getTelegramPricePremiumLine(etf.price, premStr, locale)
      lines.push(
        `<b>${escapeHtml(etf.name)}</b>\n` +
          `${escapeHtml(line)} ${signal}`,
      )
      lines.push("")
    }
    const footer =
      locale === "en"
        ? "Cached ~30s. /help — more commands & website."
        : "약 30초 캐시입니다. /help — 다른 명령·웹 링크."
    lines.push(`<i>${escapeHtml(footer)}</i>`)
    return { ok: true, html: lines.join("\n").trimEnd() }
  } catch {
    return {
      ok: false,
      message:
        locale === "en"
          ? "Could not load market data. Try again later."
          : "시세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    }
  }
}

export async function buildTelegramSubscribedPremiumSnapshotHtml(
  locale: Locale,
  tickers: string[],
  brokerIds: string[] | null,
): Promise<{ ok: true; html: string } | { ok: false; message: string }> {
  const uniq = [...new Set(tickers.map((t) => t.replace(/\D/g, "")))].filter(
    (t) => t.length === 6,
  )
  if (uniq.length === 0) {
    return {
      ok: false,
      message:
        locale === "en"
          ? "No ETFs to show yet. Add some in My page (website) or run /subscribe. If My page has ETFs, link Telegram from My page first."
          : "표시할 관심 ETF가 없습니다. 웹 마이페이지에서 추가하거나 /subscribe 로 구독하세요. 마이페이지에만 있다면 텔레그램 연동 후 다시 /my 를 눌러 보세요.",
    }
  }

  try {
    const etfList = await getEtfList()
    const calculatedAt = new Date()
    const kst = formatTelegramKstTime(calculatedAt, locale)
    const header =
      locale === "en"
        ? `My subscriptions (${kst} KST)`
        : `내 구독 괴리율 (${kst} KST 기준)`

    const byTicker = new Map(etfList.map((e) => [e.ticker, e]))
    const lines: string[] = [`<b>${escapeHtml(header)}</b>`, ""]

    let found = 0
    for (const ticker of uniq) {
      const etf = byTicker.get(ticker)
      if (!etf) continue
      found += 1
      const signal = getTelegramDigestSignalLabel(etf.signal, locale)
      const premStr = formatTelegramPremiumPct(etf.premium)
      const line = getTelegramPricePremiumLine(etf.price, premStr, locale)
      lines.push(
        `<b>${escapeHtml(etf.name)}</b>\n` +
          `${escapeHtml(line)} ${signal}` +
          buildSubscriptionQuickLinksHtml(etf.ticker, locale, brokerIds),
      )
      lines.push("")
    }

    if (found === 0) {
      return {
        ok: false,
        message:
          locale === "en"
            ? "Subscribed tickers were not found. Run /subscribe or /edit again."
            : "구독한 ETF를 찾을 수 없습니다. /subscribe 또는 /edit 로 다시 설정해 주세요.",
      }
    }

    const footer =
      locale === "en"
        ? "Cached ~30s. /edit — change thresholds."
        : "약 30초 캐시입니다. /edit — 기준 수정."
    lines.push(`<i>${escapeHtml(footer)}</i>`)

    return { ok: true, html: lines.join("\n").trimEnd() }
  } catch {
    return {
      ok: false,
      message:
        locale === "en"
          ? "Could not load market data. Try again later."
          : "시세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    }
  }
}
