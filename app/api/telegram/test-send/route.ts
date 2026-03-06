/**
 * 테스트용: TELEGRAM_TEST_CHAT_ID 로 메시지 1통 전송
 * - chat_id는 .env.local 또는 Vercel에 TELEGRAM_TEST_CHAT_ID 로 설정
 * - GET /api/telegram/test-send 호출 시 해당 채팅방으로 "테스트 알림" 전송
 */

import { NextResponse } from "next/server"
import { sendText } from "@/lib/telegram"

export async function GET() {
  const raw = process.env.TELEGRAM_TEST_CHAT_ID
  if (raw == null || raw === "") {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_TEST_CHAT_ID not set" },
      { status: 400 },
    )
  }

  const chatId = Number.parseInt(raw, 10)
  if (!Number.isFinite(chatId)) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_TEST_CHAT_ID must be a number" },
      { status: 400 },
    )
  }

  const result = await sendText(chatId, "📊 ETF 봇 테스트 알림\n\n연결이 정상입니다.")
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, sent_to: chatId })
}
