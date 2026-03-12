export const locales = ["ko", "en"] as const
export type Locale = (typeof locales)[number]

/** 저장소/DB에 값이 없을 때 사용. 한국(ko-KR 등)이면 ko, 그 외 en */
export const defaultLocale: Locale = "ko"

export const localeStorageKey = "etf-calculator-locale"

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

/** 브라우저 접속 환경 기준 기본 언어: 한국이면 ko, 그 외 en (클라이언트 전용) */
export function getDetectedLocale(): Locale {
  if (typeof navigator === "undefined") return defaultLocale
  const lang = navigator.language ?? (navigator as { userLanguage?: string }).userLanguage ?? ""
  if (lang.startsWith("ko")) return "ko"
  return "en"
}
