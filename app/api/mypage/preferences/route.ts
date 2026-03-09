import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/auth/auth";
import { db } from "@/lib/db";
import { userPreferences, users } from "@/lib/db/schema";

export type EtfPreferenceItemType = {
  buyPremiumThreshold: number;
  sellPremiumThreshold: number;
};

export interface MypagePreferencesResponseType {
  preferences: Record<string, EtfPreferenceItemType>;
  telegramLinked?: boolean;
}

const DEFAULT_BUY = -1;
const DEFAULT_SELL = 1;

export async function GET(): Promise<
  NextResponse<MypagePreferencesResponseType | { error: string }>
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [prefRow, userRow] = await Promise.all([
    db
      .select({ preferences: userPreferences.preferences })
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select({ telegramId: users.telegramId })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  const raw = prefRow?.preferences ?? {};
  const preferences: Record<string, EtfPreferenceItemType> = {};
  for (const [etfId, p] of Object.entries(raw)) {
    if (
      etfId &&
      p &&
      typeof p.buyPremiumThreshold === "number" &&
      typeof p.sellPremiumThreshold === "number"
    ) {
      preferences[etfId] = {
        buyPremiumThreshold: p.buyPremiumThreshold,
        sellPremiumThreshold: p.sellPremiumThreshold,
      };
    }
  }

  return NextResponse.json({
    preferences,
    telegramLinked: Boolean(userRow?.telegramId),
  });
}

export async function PATCH(
  request: Request
): Promise<NextResponse<MypagePreferencesResponseType | { error: string }>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { preferences?: Record<string, { buyPremiumThreshold?: number; sellPremiumThreshold?: number }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prefs = body.preferences;
  if (!prefs || typeof prefs !== "object") {
    return GET();
  }

  const userId = session.user.id;
  const nextPrefs: Record<string, { buyPremiumThreshold: number; sellPremiumThreshold: number }> = {};
  for (const [etfId, value] of Object.entries(prefs)) {
    if (!etfId || typeof value !== "object") {
      continue;
    }
    const buy = typeof value.buyPremiumThreshold === "number" ? value.buyPremiumThreshold : DEFAULT_BUY;
    const sell = typeof value.sellPremiumThreshold === "number" ? value.sellPremiumThreshold : DEFAULT_SELL;
    nextPrefs[etfId] = { buyPremiumThreshold: buy, sellPremiumThreshold: sell };
  }

  await db
    .insert(userPreferences)
    .values({
      userId,
      preferences: nextPrefs,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        preferences: nextPrefs,
        updatedAt: new Date(),
      },
    });

  return GET();
}
