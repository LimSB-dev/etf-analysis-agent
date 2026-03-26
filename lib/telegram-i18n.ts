import type { Locale } from "@/lib/i18n/config"
import { isValidLocale } from "@/lib/i18n/config"

export function resolveTelegramLocale(
  dbLocale: string | null | undefined,
): Locale {
  if (dbLocale && isValidLocale(dbLocale)) {
    return dbLocale
  }
  return "ko"
}

export function formatTelegramPrice(value: number, locale: Locale): string {
  return Math.round(value).toLocaleString(locale === "en" ? "en-US" : "ko-KR")
}

export function formatTelegramPremiumPct(value: number): string {
  return `${value.toFixed(2)}%`
}

/** KST 기준 시각 문자열 */
export function formatTelegramKstTime(date: Date, locale: Locale): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }
  const parts = new Intl.DateTimeFormat(
    locale === "en" ? "en-GB" : "ko-KR",
    opts,
  ).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  const y = get("year")
  const m = get("month").padStart(2, "0")
  const d = get("day").padStart(2, "0")
  const h = get("hour").padStart(2, "0")
  const min = get("minute").padStart(2, "0")
  return `${y}-${m}-${d} ${h}:${min}`
}

export type TelegramPersonalSignalType =
  | "buy_and_sell"
  | "buy"
  | "sell"
  | "hold"

export function getTelegramPersonalSignalLabel(
  signal: TelegramPersonalSignalType,
  locale: Locale,
): string {
  if (locale === "en") {
    switch (signal) {
      case "buy_and_sell":
        return "🟢 Buy / 🔴 Sell"
      case "buy":
        return "🟢 Buy"
      case "sell":
        return "🔴 Sell"
      default:
        return "⚪ Hold"
    }
  }
  switch (signal) {
    case "buy_and_sell":
      return "🟢 매수 / 🔴 매도"
    case "buy":
      return "🟢 매수"
    case "sell":
      return "🔴 매도"
    default:
      return "⚪ HOLD"
  }
}

export function getTelegramDigestSignalLabel(
  etfSignal: "BUY" | "SELL" | "HOLD",
  locale: Locale,
): string {
  if (locale === "en") {
    return etfSignal === "BUY"
      ? "🟢 BUY"
      : etfSignal === "SELL"
        ? "🔴 SELL"
        : "⚪ HOLD"
  }
  return etfSignal === "BUY"
    ? "🟢 매수"
    : etfSignal === "SELL"
      ? "🔴 매도"
      : "⚪ HOLD"
}

export function getTelegramDigestHeader(
  kstTimeStr: string,
  locale: Locale,
): string {
  if (locale === "en") {
    return `📊 Watchlist ETF summary (as of: ${kstTimeStr} KST)`
  }
  return `📊 관심 ETF 요약 (기준 시각: ${kstTimeStr} KST)`
}

export function getTelegramPricePremiumLine(
  price: number,
  premium: string,
  locale: Locale,
): string {
  const priceLabel = locale === "en" ? "Price" : "현재가"
  const premLabel = locale === "en" ? "Premium" : "괴리율"
  return `${priceLabel} ${formatTelegramPrice(price, locale)} · ${premLabel} ${premium}`
}
