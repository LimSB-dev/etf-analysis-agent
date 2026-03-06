import { localeStorageKey } from "../test-i18n";

/** 프리미엄 문자열(예: "-1.25%", "+0.50%")에서 숫자만 파싱 */
export function parsePremiumFromText(text: string | null): number | null {
  if (!text) return null;
  const m = text.trim().match(/^([-+]?\d+(?:\.\d+)?)\s*%?$/);
  return m ? Number.parseFloat(m[1]) : null;
}

/** 로케일을 localStorage에 설정하는 payload (addInitScript용) */
export const localeInitPayload = { key: localeStorageKey, value: "ko" } as const;

export function getLocaleInitScript() {
  return (payload: { key: string; value: string }) =>
    localStorage.setItem(payload.key, payload.value);
}
