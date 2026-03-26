import { BROKER_DEEP_LINK_IDS, BROKER_DEEP_LINK_OPTIONS } from "@/lib/broker-deep-links"
import type { InlineKeyboardButtonType } from "@/lib/telegram"

export type TelegramBrokerUiLocaleType = "ko" | "en"

export function brokerPromptHtml(
  selected: string[],
  locale: TelegramBrokerUiLocaleType,
): string {
  const n = selected.length
  if (locale === "en") {
    return (
      `📱 <b>Broker app deep links</b>\n` +
      `Choose up to <b>3</b> brokers (optional). Naver &amp; Toss links are always included.\n` +
      `Selected: <b>${n}/3</b>`
    )
  }
  return (
    `📱 <b>증권사 앱 딥링크</b>\n` +
    `알림에 넣을 증권사를 <b>최대 3개</b>까지 선택하세요.\n` +
    `(네이버·토스 링크는 항상 포함됩니다)\n` +
    `선택: <b>${n}/3</b>`
  )
}

export function buildBrokerPickKeyboard(
  selected: string[],
  locale: TelegramBrokerUiLocaleType,
): InlineKeyboardButtonType[][] {
  const selSet = new Set(selected)
  const rows: InlineKeyboardButtonType[][] = []
  let row: InlineKeyboardButtonType[] = []
  for (let i = 0; i < BROKER_DEEP_LINK_OPTIONS.length; i++) {
    const o = BROKER_DEEP_LINK_OPTIONS[i]
    const label = locale === "en" ? o.labelEn : o.labelKo
    const mark = selSet.has(o.id) ? "✓ " : ""
    row.push({
      text: `${mark}${label}`,
      callback_data: `brk:t:${o.id}`,
    })
    if (row.length === 4) {
      rows.push(row)
      row = []
    }
  }
  if (row.length > 0) {
    rows.push(row)
  }
  const doneLabel = locale === "en" ? "✅ Done" : "✅ 완료"
  const skipLabel =
    locale === "en" ? "⏭ Skip (app links off)" : "⏭ 건너뛰기(앱 링크 없음)"
  rows.push([
    { text: doneLabel, callback_data: "brk:done" },
    { text: skipLabel, callback_data: "brk:skip" },
  ])
  return rows
}

export function toggleBrokerSelection(selected: string[], id: string): string[] {
  if (!BROKER_DEEP_LINK_IDS.includes(id)) {
    return selected
  }
  const set = new Set(selected)
  if (set.has(id)) {
    set.delete(id)
  } else if (set.size < 3) {
    set.add(id)
  }
  return normalizeBrokerIdsArray([...set])
}

function normalizeBrokerIdsArray(ids: string[]): string[] {
  const allowed = new Set(BROKER_DEEP_LINK_IDS)
  return [...new Set(ids.filter((x) => allowed.has(x)))].slice(0, 3)
}
