import type { Locale } from "@/lib/i18n/config";
import { defaultLocale, localeStorageKey } from "@/lib/i18n/config";
import koMessages from "@/messages/ko.json";
import enMessages from "@/messages/en.json";

export { localeStorageKey } from "@/lib/i18n/config";

const messagesMap = {
  ko: koMessages,
  en: enMessages,
} as const;

export type TestMessagesType = typeof koMessages;

export function getTestMessages(locale: Locale = defaultLocale): TestMessagesType {
  return messagesMap[locale];
}

/** e2e 기본 로케일(한국어) 메시지 — 테스트에서 이 로케일로 앱이 뜨도록 설정함 */
export const t = getTestMessages("ko");
