/**
 * Telegram Bot API 래퍼
 * - 메시지 전송, Inline Keyboard 전송
 * - 환경변수: TELEGRAM_BOT_TOKEN
 */

const TELEGRAM_API_BASE = "https://api.telegram.org"

export interface InlineKeyboardButtonType {
  text: string
  callback_data: string
}

export interface SendMessageOptionsType {
  chat_id: number
  text: string
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2"
  reply_markup?: {
    inline_keyboard: InlineKeyboardButtonType[][]
  }
}

/**
 * 봇 토큰 반환. 없으면 null
 */
function getBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN ?? null
}

/**
 * Telegram sendMessage API 호출
 * @see https://core.telegram.org/bots/api#sendmessage
 */
export async function sendTelegramMessage(
  options: SendMessageOptionsType,
): Promise<{ ok: boolean; error?: string }> {
  const token = getBotToken()
  if (!token) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" }
  }

  const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    })
    const data = (await res.json()) as { ok: boolean; description?: string }
    if (!data.ok) {
      return { ok: false, error: data.description ?? "Unknown error" }
    }
    return { ok: true }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return { ok: false, error: err }
  }
}

/**
 * 단순 텍스트 메시지 전송 (키보드 없음)
 */
export async function sendText(
  chatId: number,
  text: string,
  parseMode: "HTML" | "Markdown" | "MarkdownV2" = "HTML",
): Promise<{ ok: boolean; error?: string }> {
  return sendTelegramMessage({
    chat_id: chatId,
    text,
    parse_mode: parseMode,
  })
}

/**
 * Inline Keyboard가 포함된 메시지 전송
 * @param buttons 2차원 배열. 한 행당 여러 버튼 가능
 */
export async function sendMessageWithKeyboard(
  chatId: number,
  text: string,
  buttons: InlineKeyboardButtonType[][],
  parseMode: "HTML" | "Markdown" | "MarkdownV2" = "HTML",
): Promise<{ ok: boolean; error?: string }> {
  return sendTelegramMessage({
    chat_id: chatId,
    text,
    parse_mode: parseMode,
    reply_markup: { inline_keyboard: buttons },
  })
}

/**
 * Inline 버튼 클릭 시 로딩 해제용 (callback_query 응답)
 * @see https://core.telegram.org/bots/api#answercallbackquery
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
): Promise<{ ok: boolean }> {
  const token = getBotToken()
  if (!token) {
    return { ok: false }
  }
  try {
    const res = await fetch(
      `${TELEGRAM_API_BASE}/bot${token}/answerCallbackQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQueryId }),
      },
    )
    const data = (await res.json()) as { ok: boolean }
    return { ok: data.ok }
  } catch {
    return { ok: false }
  }
}
