import type { Locale } from "@/lib/i18n/config"

/** Telegram HTML parse_mode용 이스케이프 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/**
 * 구독 알림에 붙이는 "빠른 이동" 링크 (종목코드 = KRX 6자리, 서비스의 etf.ticker와 동일)
 *
 * - https 링크는 Telegram에서 안정적으로 탭 가능 (모바일에서 앱 연동되는 경우도 있음)
 * - 커스텀 스킴(miraeassetTrade:// 등)은 앱·버전마다 동작이 달라 본문에 보조로만 표기
 */

const NAVER_STOCK_MOBILE = (code: string) =>
  `https://m.stock.naver.com/domestic/stock/${code}/total`

/** 토스증권 국내 종목 웹 (A + 6자리 종목코드) */
const TOSS_STOCK_ORDER = (code: string) =>
  `https://tossinvest.com/stocks/A${code}/order`

/** 증권사 앱 스킴(경로는 비공개·변경 가능 — 탭 시 앱만 열리거나 무시될 수 있음) */
const OPTIONAL_APP_SCHEMES: Array<{ label: string; build: (code: string) => string }> = [
  { label: "미래에셋 M-STOCK", build: (c) => `miraeassetTrade://?code=${c}` },
  { label: "키움 영웅문S#", build: (c) => `heromts://?code=${c}` },
  { label: "KB M-able", build: (c) => `kbma://?code=${c}` },
  { label: "삼성 mPOP", build: (c) => `mpopapp://?code=${c}` },
  { label: "한국투자", build: (c) => `neosmartaf://?code=${c}` },
  { label: "NH 나무", build: (c) => `txsmart://?code=${c}` },
  { label: "신한 알파", build: (c) => `newshinhanialpha://?code=${c}` },
  { label: "하나 원큐프로", build: (c) => `hanaoneqpro://?code=${c}` },
]

function normalizeSixDigitCode(raw: string): string | null {
  const digits = raw.replace(/\D/g, "")
  if (digits.length !== 6) {
    return null
  }
  return digits
}

/**
 * HTML(parse_mode HTML)용: 구독 전용 메시지 하단에 붙이는 링크 블록
 * @param includeAppSchemes - TELEGRAM_INCLUDE_BROKER_APP_SCHEMES=1 일 때만 증권사 커스텀 스킴 줄 추가 (비기본)
 */
export function buildSubscriptionQuickLinksHtml(
  etfCode: string,
  locale: Locale = "ko",
  includeAppSchemes = process.env.TELEGRAM_INCLUDE_BROKER_APP_SCHEMES === "1",
): string {
  const code = normalizeSixDigitCode(etfCode)
  if (!code) {
    return ""
  }
  const naver = NAVER_STOCK_MOBILE(code)
  const toss = TOSS_STOCK_ORDER(code)
  const quickTitle = locale === "en" ? "🔗 Quick links" : "🔗 빠른 이동"
  const naverLabel = locale === "en" ? "Naver quote" : "네이버 시세"
  const tossLabel = locale === "en" ? "Toss Securities" : "토스증권"
  const schemeNote =
    locale === "en"
      ? "📱 App deep links (behavior varies by app/version)"
      : "📱 앱 딥링크(앱·버전마다 다를 수 있음)"
  const lines: string[] = [
    "",
    quickTitle,
    `<a href="${naver}">${naverLabel}</a> · <a href="${toss}">${tossLabel}</a>`,
  ]
  if (includeAppSchemes) {
    lines.push(
      "",
      schemeNote,
    )
    for (const { label, build } of OPTIONAL_APP_SCHEMES) {
      lines.push(`${label}: ${build(code)}`)
    }
  }
  return lines.join("\n")
}
