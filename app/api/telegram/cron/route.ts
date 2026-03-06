/**
 * CRON: 매일 평일 09:30 실행 (vercel.json cron)
 * - 모든 구독 조회 → /api/etfs 호출 → premium ≤ threshold 인 경우 Telegram 알림 발송
 * - Vercel Cron은 Authorization: Bearer ${CRON_SECRET} 헤더로 호출하므로, 동일 시크릿으로 검증 권장
 */

import { NextRequest, NextResponse } from "next/server"
import { listSubscriptions } from "@/lib/subscriptions"
import { sendText } from "@/lib/telegram"
import type { EtfApiItemType } from "@/app/api/etfs/route"

/** 숫자 포맷 (천 단위 구분, 소수는 premium만) */
function formatPrice(value: number): string {
  return Math.round(value).toLocaleString("ko-KR")
}

function formatPremium(value: number): string {
  return `${value.toFixed(2)}%`
}

/** 알림 메시지 본문 생성 */
function buildAlertMessage(etf: EtfApiItemType): string {
  return (
    "📊 ETF 매수 신호\n\n" +
    `${etf.name}\n\n` +
    `현재가: ${formatPrice(etf.price)}\n` +
    `적정가: ${formatPrice(etf.fairValue)}\n` +
    `괴리율: ${formatPremium(etf.premium)}\n\n` +
    "🟢 BUY SIGNAL"
  )
}

export async function GET(request: NextRequest) {
  // Vercel Cron은 CRON_SECRET으로 보호 가능 (환경변수 설정 시에만 검사)
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace(/^Bearer\s+/i, "")
    if (token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  let etfList: EtfApiItemType[]
  try {
    const res = await fetch(`${baseUrl}/api/etfs`, { cache: "no-store" })
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch ETF data", status: res.status },
        { status: 502 },
      )
    }
    etfList = (await res.json()) as EtfApiItemType[]
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: "ETF API request failed", detail: err },
      { status: 502 },
    )
  }

  const subscriptions = await listSubscriptions()
  if (subscriptions.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No subscriptions" })
  }

  const tickerMap = new Map(etfList.map((e) => [e.ticker, e]))
  let sentCount = 0

  for (const sub of subscriptions) {
    const etf = tickerMap.get(sub.etf_ticker)
    if (!etf) {
      continue
    }
    // 괴리율이 사용자 설정 기준 이하일 때만 알림 (매수 신호)
    if (etf.premium > sub.premium_threshold) {
      continue
    }
    const result = await sendText(sub.chat_id, buildAlertMessage(etf))
    if (result.ok) {
      sentCount += 1
    }
  }

  return NextResponse.json({ ok: true, sent: sentCount })
}
