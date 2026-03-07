/**
 * CRON: 매일 평일 09:30 실행 (vercel.json cron)
 * - ETF 계산 후 채널 브로드캐스트로 메시지 전송 (구독 시스템은 사용하지 않음)
 * - Vercel Cron은 Authorization: Bearer ${CRON_SECRET} 헤더로 호출하므로, 동일 시크릿으로 검증 권장
 */

import { NextRequest, NextResponse } from "next/server"
import { getEtfList, type EtfApiItemType } from "@/lib/getEtfList"
// 구독 시스템: 현재 미사용 (채널 브로드캐스트 방식)
// import { listSubscriptions } from "@/lib/subscriptions"
import { sendToChannel } from "@/lib/telegram"

/** 숫자 포맷 (천 단위 구분, 소수는 premium만) */
function formatPrice(value: number): string {
  return Math.round(value).toLocaleString("ko-KR")
}

function formatPremium(value: number): string {
  return `${value.toFixed(2)}%`
}

/** ETF 목록을 한 메시지로 요약 (BUY/SELL 신호 포함) */
function buildBroadcastMessage(etfList: EtfApiItemType[]): string {
  const lines = ["📊 ETF 괴리율 알림", ""]
  for (const etf of etfList) {
    const signal =
      etf.signal === "BUY"
        ? "🟢 BUY"
        : etf.signal === "SELL"
          ? "🔴 SELL"
          : "⚪ HOLD"
    lines.push(
      `${etf.name}\n` +
        `현재가 ${formatPrice(etf.price)} · 괴리율 ${formatPremium(etf.premium)} ${signal}`,
    )
    lines.push("")
  }
  return lines.join("\n").trimEnd()
}

export async function GET(request: NextRequest) {
  // Vercel Cron은 Authorization: Bearer ${CRON_SECRET} 헤더로 호출됨. 반드시 CRON_SECRET 설정 필요.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 },
    )
  }
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace(/^Bearer\s+/i, "")
  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let etfList: EtfApiItemType[]
  try {
    etfList = await getEtfList()
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: "ETF data failed", detail: err },
      { status: 502 },
    )
  }

  const message = buildBroadcastMessage(etfList)
  const result = await sendToChannel(message)

  if (!result.ok) {
    return NextResponse.json(
      { error: "Telegram send failed", detail: result.error },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, sent: 1 })
}
