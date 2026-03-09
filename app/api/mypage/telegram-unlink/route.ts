import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/auth/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { removeSubscriptionsByChatId } from "@/lib/subscriptions";

export async function POST(): Promise<
  NextResponse<{ ok: boolean } | { error: string }>
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [userRow] = await db
    .select({ telegramId: users.telegramId })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const chatIdRaw = userRow?.telegramId;
  if (chatIdRaw != null && chatIdRaw !== "") {
    const chatId = Number(chatIdRaw);
    if (Number.isFinite(chatId)) {
      await removeSubscriptionsByChatId(chatId);
    }
  }

  await db
    .update(users)
    .set({ telegramId: null })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true });
}
