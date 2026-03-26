import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/auth/auth";
import { normalizeBrokerIds, setBrokerLinkPrefs } from "@/lib/broker-link-prefs";
import { db } from "@/lib/db";
import { userPreferences, users } from "@/lib/db/schema";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

export type EtfPreferenceItemType = {
  buyPremiumThreshold: number;
  /** null: 매도 알림 없음(텔레그램과 동일 의미) */
  sellPremiumThreshold: number | null;
};

export interface MypagePreferencesResponseType {
  preferences: Record<string, EtfPreferenceItemType>;
  telegramLinked?: boolean;
  locale?: Locale | null;
  /** null = 웹에서 아직 저장 안 함(텔레그램·KV 설정만 사용 가능) */
  telegramBrokerLinkIds: string[] | null;
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
      .select({
        preferences: userPreferences.preferences,
        telegramBrokerLinkIds: userPreferences.telegramBrokerLinkIds,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select({ telegramId: users.telegramId, locale: users.locale })
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
      (p.sellPremiumThreshold === null ||
        typeof p.sellPremiumThreshold === "number")
    ) {
      preferences[etfId] = {
        buyPremiumThreshold: p.buyPremiumThreshold,
        sellPremiumThreshold: p.sellPremiumThreshold,
      };
    }
  }

  let telegramBrokerLinkIds: string[] | null = null;
  if (
    Array.isArray(prefRow?.telegramBrokerLinkIds) &&
    prefRow.telegramBrokerLinkIds.every((x) => typeof x === "string")
  ) {
    telegramBrokerLinkIds = normalizeBrokerIds(prefRow.telegramBrokerLinkIds);
  } else if (prefRow?.telegramBrokerLinkIds === null) {
    telegramBrokerLinkIds = null;
  }

  const locale =
    userRow?.locale && isValidLocale(userRow.locale) ? userRow.locale : null;

  return NextResponse.json({
    preferences,
    telegramLinked: Boolean(userRow?.telegramId),
    locale,
    telegramBrokerLinkIds,
  });
}

export async function PATCH(
  request: Request,
): Promise<NextResponse<MypagePreferencesResponseType | { error: string }>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    preferences?: Record<
      string,
      { buyPremiumThreshold?: number; sellPremiumThreshold?: number | null }
    >;
    locale?: string;
    telegramBrokerLinkIds?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = session.user.id;

  if (body.locale !== undefined && isValidLocale(body.locale)) {
    await db
      .update(users)
      .set({ locale: body.locale })
      .where(eq(users.id, userId));
  }

  let normalizedBrokers: string[] | undefined;
  if (body.telegramBrokerLinkIds !== undefined) {
    if (!Array.isArray(body.telegramBrokerLinkIds)) {
      return NextResponse.json(
        { error: "telegramBrokerLinkIds must be an array" },
        { status: 400 },
      );
    }
    normalizedBrokers = normalizeBrokerIds(
      body.telegramBrokerLinkIds.map((x) => String(x)),
    );
  }

  const prefs = body.preferences;
  if (prefs && typeof prefs === "object") {
    const nextPrefs: Record<
      string,
      { buyPremiumThreshold: number; sellPremiumThreshold: number | null }
    > = {};
    for (const [etfId, value] of Object.entries(prefs)) {
      if (!etfId || typeof value !== "object") {
        continue;
      }
      const buy =
        typeof value.buyPremiumThreshold === "number"
          ? value.buyPremiumThreshold
          : DEFAULT_BUY;
      let sell: number | null;
      if (value.sellPremiumThreshold === null) {
        sell = null;
      } else if (typeof value.sellPremiumThreshold === "number") {
        sell = value.sellPremiumThreshold;
      } else {
        sell = DEFAULT_SELL;
      }
      nextPrefs[etfId] = { buyPremiumThreshold: buy, sellPremiumThreshold: sell };
    }

    const insertValues: {
      userId: string;
      preferences: typeof nextPrefs;
      telegramBrokerLinkIds?: string[] | null;
      updatedAt: Date;
    } = {
      userId,
      preferences: nextPrefs,
      updatedAt: new Date(),
    };
    const updateSet: {
      preferences: typeof nextPrefs;
      telegramBrokerLinkIds?: string[] | null;
      updatedAt: Date;
    } = {
      preferences: nextPrefs,
      updatedAt: new Date(),
    };
    if (normalizedBrokers !== undefined) {
      insertValues.telegramBrokerLinkIds = normalizedBrokers;
      updateSet.telegramBrokerLinkIds = normalizedBrokers;
    }

    await db
      .insert(userPreferences)
      .values(insertValues)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: updateSet,
      });
  } else if (normalizedBrokers !== undefined) {
    await db
      .insert(userPreferences)
      .values({
        userId,
        preferences: {},
        telegramBrokerLinkIds: normalizedBrokers,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          telegramBrokerLinkIds: normalizedBrokers,
          updatedAt: new Date(),
        },
      });
  }

  if (normalizedBrokers !== undefined) {
    const u = await db
      .select({ telegramId: users.telegramId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((r) => r[0] ?? null);
    if (u?.telegramId) {
      const cid = Number.parseInt(u.telegramId, 10);
      if (Number.isFinite(cid)) {
        await setBrokerLinkPrefs(cid, normalizedBrokers);
      }
    }
  }

  return GET();
}
