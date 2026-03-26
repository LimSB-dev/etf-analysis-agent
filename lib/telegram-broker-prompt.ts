import {
  BROKER_DEEP_LINK_IDS,
  BROKER_DEEP_LINK_OPTIONS,
  MAX_QUICK_LINK_SELECTIONS,
} from "@/lib/broker-deep-links"
import type { InlineKeyboardButtonType } from "@/lib/telegram"

export type TelegramBrokerUiLocaleType = "ko" | "en"

export function brokerPromptHtml(
  selected: string[],
  locale: TelegramBrokerUiLocaleType,
): string {
  const n = selected.length
  const max = MAX_QUICK_LINK_SELECTIONS
  if (locale === "en") {
    return (
      `📱 <b>Quick links in alerts</b>\n` +
      `Pick up to <b>${max}</b> links: Naver, Toss, and broker app schemes (all optional).\n` +
      `Selected: <b>${n}/${max}</b>`
    )
  }
  return (
    `📱 <b>알림 빠른 이동</b>\n` +
    `네이버·토스·증권사 앱 링크를 <b>최대 ${max}개</b>까지 골라 넣을 수 있어요.\n` +
    `선택: <b>${n}/${max}</b>`
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
    locale === "en" ? "⏭ Skip (no quick links)" : "⏭ 건너뛰기(링크 없음)"
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
  } else if (set.size < MAX_QUICK_LINK_SELECTIONS) {
    set.add(id)
  }
  return normalizeBrokerIdsArray([...set])
}

function normalizeBrokerIdsArray(ids: string[]): string[] {
  const allowed = new Set(BROKER_DEEP_LINK_IDS)
  return [...new Set(ids.filter((x) => allowed.has(x)))].slice(
    0,
    MAX_QUICK_LINK_SELECTIONS,
  )
}
