/**
 * 테스트용: 채널로 "ETF ALERT TEST" 전송
 * GET /api/telegram/test
 */

import { NextResponse } from "next/server"
import { sendToChannel } from "@/lib/telegram"

const TEST_MESSAGE = "ETF ALERT TEST"

export async function GET() {
  const result = await sendToChannel(TEST_MESSAGE)
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 502 },
    )
  }
  return NextResponse.json({ ok: true, message: TEST_MESSAGE })
}
