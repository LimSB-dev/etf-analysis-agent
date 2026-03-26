import type { Locale } from "@/lib/i18n/config"

/** Telegram HTML parse_mode용 이스케이프 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

const NAVER_STOCK_MOBILE = (code: string) =>
  `https://m.stock.naver.com/domestic/stock/${code}/total`

const TOSS_STOCK_ORDER = (code: string) =>
  `https://tossinvest.com/stocks/A${code}/order`

export type BrokerDeepLinkOptionType = {
  id: string
  labelKo: string
  labelEn: string
  build: (code: string) => string
}

/** 알림에 넣을 수 있는 증권사 앱 스킴(최대 3개 선택) */
export const BROKER_DEEP_LINK_OPTIONS: BrokerDeepLinkOptionType[] = [
  {
    id: "mirae",
    labelKo: "미래에셋",
    labelEn: "Mirae",
    build: (c) => `miraeassetTrade://?code=${c}`,
  },
  {
    id: "kiwoom",
    labelKo: "키움",
    labelEn: "Kiwoom",
    build: (c) => `heromts://?code=${c}`,
  },
  {
    id: "kb",
    labelKo: "KB",
    labelEn: "KB",
    build: (c) => `kbma://?code=${c}`,
  },
  {
    id: "samsung",
    labelKo: "삼성",
    labelEn: "Samsung",
    build: (c) => `mpopapp://?code=${c}`,
  },
  {
    id: "hankook",
    labelKo: "한국투자",
    labelEn: "Korea Inv.",
    build: (c) => `neosmartaf://?code=${c}`,
  },
  {
    id: "nh",
    labelKo: "NH",
    labelEn: "NH",
    build: (c) => `txsmart://?code=${c}`,
  },
  {
    id: "shinhan",
    labelKo: "신한",
    labelEn: "Shinhan",
    build: (c) => `newshinhanialpha://?code=${c}`,
  },
  {
    id: "hana",
    labelKo: "하나",
    labelEn: "Hana",
    build: (c) => `hanaoneqpro://?code=${c}`,
  },
]

export const BROKER_DEEP_LINK_IDS = BROKER_DEEP_LINK_OPTIONS.map((o) => o.id)

export function getBrokerOptionById(id: string): BrokerDeepLinkOptionType | undefined {
  return BROKER_DEEP_LINK_OPTIONS.find((o) => o.id === id)
}

function normalizeSixDigitCode(raw: string): string | null {
  const digits = raw.replace(/\D/g, "")
  if (digits.length !== 6) {
    return null
  }
  return digits
}

/**
 * @param selectedBrokerIds
 *   - null: 레거시 — TELEGRAM_INCLUDE_BROKER_APP_SCHEMES=1 이면 전 증권사 스킴 포함
 *   - []: 네이버·토스만 (앱 스킴 없음)
 *   - 1~3개 id: 해당 증권사만
 */
export function buildSubscriptionQuickLinksHtml(
  etfCode: string,
  locale: Locale = "ko",
  selectedBrokerIds: string[] | null = null,
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

  let includeSchemes = false
  let schemesToShow: BrokerDeepLinkOptionType[] = []

  if (selectedBrokerIds === null) {
    includeSchemes = process.env.TELEGRAM_INCLUDE_BROKER_APP_SCHEMES === "1"
    if (includeSchemes) {
      schemesToShow = [...BROKER_DEEP_LINK_OPTIONS]
    }
  } else {
    const allowed = new Set(BROKER_DEEP_LINK_IDS)
    const picked = [...new Set(selectedBrokerIds)]
      .filter((id) => allowed.has(id))
      .slice(0, 3)
    if (picked.length > 0) {
      includeSchemes = true
      schemesToShow = picked
        .map((id) => getBrokerOptionById(id))
        .filter((x): x is BrokerDeepLinkOptionType => x != null)
    }
  }

  if (includeSchemes && schemesToShow.length > 0) {
    lines.push("", schemeNote)
    const label = (o: BrokerDeepLinkOptionType) =>
      locale === "en" ? o.labelEn : o.labelKo
    for (const o of schemesToShow) {
      lines.push(`${label(o)}: ${o.build(code)}`)
    }
  }

  return lines.join("\n")
}
