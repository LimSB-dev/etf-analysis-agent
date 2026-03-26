import type { Locale } from "@/lib/i18n/config"

/** Telegram HTML parse_mode용 이스케이프 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export type BrokerDeepLinkOptionType = {
  id: string
  labelKo: string
  labelEn: string
  build: (code: string) => string
}

/** 네이버·토스·증권사 앱 합산 최대 선택 개수 */
export const MAX_QUICK_LINK_SELECTIONS = 5

/** 알림 빠른 이동(네이버·토스·증권사 앱, 최대 MAX_QUICK_LINK_SELECTIONS개) */
export const BROKER_DEEP_LINK_OPTIONS: BrokerDeepLinkOptionType[] = [
  {
    id: "naver",
    labelKo: "네이버 시세",
    labelEn: "Naver quote",
    build: (c) => `https://m.stock.naver.com/domestic/stock/${c}/total`,
  },
  {
    id: "toss",
    labelKo: "토스증권",
    labelEn: "Toss Securities",
    build: (c) => `https://tossinvest.com/stocks/A${c}/order`,
  },
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
 *   - null: 레거시 — TELEGRAM_INCLUDE_BROKER_APP_SCHEMES=1 이면 전 항목(네이버·토스·전 증권사) 표시, 아니면 빈 문자열
 *   - []: 빠른 이동 블록 없음
 *   - 1~MAX_QUICK_LINK_SELECTIONS개 id: 선택한 링크만(네이버·토스·증권사 id 혼합)
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
  const quickTitle = locale === "en" ? "🔗 Quick links" : "🔗 빠른 이동"

  let ordered: BrokerDeepLinkOptionType[] = []

  if (selectedBrokerIds === null) {
    const includeAll = process.env.TELEGRAM_INCLUDE_BROKER_APP_SCHEMES === "1"
    if (!includeAll) {
      return ""
    }
    ordered = [...BROKER_DEEP_LINK_OPTIONS]
  } else {
    const allowed = new Set(BROKER_DEEP_LINK_IDS)
    const picked = [...new Set(selectedBrokerIds)]
      .filter((id) => allowed.has(id))
      .slice(0, MAX_QUICK_LINK_SELECTIONS)
    ordered = picked
      .map((id) => getBrokerOptionById(id))
      .filter((x): x is BrokerDeepLinkOptionType => x != null)
  }

  if (ordered.length === 0) {
    return ""
  }

  const lines: string[] = ["", quickTitle]
  const parts: string[] = []

  for (const o of ordered) {
    const label = locale === "en" ? o.labelEn : o.labelKo
    const url = o.build(code)
    parts.push(`<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`)
  }

  lines.push(parts.join(" · "))

  return lines.join("\n")
}
