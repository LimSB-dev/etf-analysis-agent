import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq, and, notInArray } from "drizzle-orm";
import { authOptions } from "@/auth/auth";
import { db } from "@/lib/db";
import { userEtfPreferences, users } from "@/lib/db/schema";

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

  const [prefRows, userRow] = await Promise.all([
    db
      .select({
        etfId: userEtfPreferences.etfId,
        buyPremiumThreshold: userEtfPreferences.buyPremiumThreshold,
        sellPremiumThreshold: userEtfPreferences.sellPremiumThreshold,
      })
      .from(userEtfPreferences)
      .where(eq(userEtfPreferences.userId, session.user.id)),
    db
      .select({ telegramId: users.telegramId })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  const preferences: Record<string, EtfPreferenceItemType> = {};
  for (const row of prefRows) {
    preferences[row.etfId] = {
      buyPremiumThreshold: row.buyPremiumThreshold ?? DEFAULT_BUY,
      sellPremiumThreshold: row.sellPremiumThreshold ?? DEFAULT_SELL,
    };
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
  const keptEtfIds = Object.keys(prefs).filter((id) => id && typeof prefs[id] === "object");

  for (const [etfId, value] of Object.entries(prefs)) {
    if (!etfId || typeof value !== "object") {
      continue;
    }
    const buy = typeof value.buyPremiumThreshold === "number" ? value.buyPremiumThreshold : DEFAULT_BUY;
    const sell = typeof value.sellPremiumThreshold === "number" ? value.sellPremiumThreshold : DEFAULT_SELL;
    await db
      .insert(userEtfPreferences)
      .values({
        userId,
        etfId,
        buyPremiumThreshold: buy,
        sellPremiumThreshold: sell,
      })
      .onConflictDoUpdate({
        target: [userEtfPreferences.userId, userEtfPreferences.etfId],
        set: {
          buyPremiumThreshold: buy,
          sellPremiumThreshold: sell,
          updatedAt: new Date(),
        },
      });
  }

  if (keptEtfIds.length > 0) {
    await db
      .delete(userEtfPreferences)
      .where(
        and(
          eq(userEtfPreferences.userId, userId),
          notInArray(userEtfPreferences.etfId, keptEtfIds),
        ),
      );
  } else {
    await db.delete(userEtfPreferences).where(eq(userEtfPreferences.userId, userId));
  }

  return GET();
}
