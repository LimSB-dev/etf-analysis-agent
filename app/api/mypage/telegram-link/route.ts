import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/auth/auth";
import { db } from "@/lib/db";
import { telegramLinkTokens } from "@/lib/db/schema";
import { getBotUsername } from "@/lib/telegram";

const TOKEN_BYTES = 24;
const EXPIRES_MINUTES = 15;

export interface TelegramLinkResponseType {
  botStartUrl: string;
  botUsername: string;
  expiresInMinutes: number;
}

export async function POST(): Promise<
  NextResponse<TelegramLinkResponseType | { error: string }>
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const botUsername = await getBotUsername();
  if (!botUsername) {
    return NextResponse.json(
      { error: "Telegram bot not configured" },
      { status: 503 },
    );
  }

  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRES_MINUTES * 60 * 1000);

  await db.insert(telegramLinkTokens).values({
    token,
    userId: session.user.id,
    expiresAt,
  });

  const botStartUrl = `https://t.me/${botUsername}?start=${token}`;

  return NextResponse.json({
    botStartUrl,
    botUsername,
    expiresInMinutes: EXPIRES_MINUTES,
  });
}
