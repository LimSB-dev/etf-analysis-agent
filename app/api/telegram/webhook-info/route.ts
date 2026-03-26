import { NextRequest, NextResponse } from "next/server";
import { getWebhookInfo } from "@/lib/telegram";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

/**
 * 운영 디버깅용: Telegram webhook 상태 확인
 * - GET /api/telegram/webhook-info
 * - Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getWebhookInfo();
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, info: result.info });
}

