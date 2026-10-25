import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { agentKeys, users } from "@/db/schema";
import { userAvatarPath } from "@/lib/avatar-paths";

export async function setUserAvatar(
  userId: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ ok: true; avatarUrl: string } | { ok: false; reason: string }> {
  const encoded = buffer.toString("base64");
  await db
    .update(users)
    .set({
      avatarContentType: contentType,
      avatarData: encoded,
    })
    .where(eq(users.id, userId));

  await db
    .update(agentKeys)
    .set({
      avatarContentType: contentType,
      avatarData: encoded,
    })
    .where(eq(agentKeys.userId, userId));

  return { ok: true, avatarUrl: userAvatarPath(userId) };
}

export async function setAgentAvatar(
  agentKeyId: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ ok: true; avatarUrl: string } | { ok: false; reason: string }> {
  const row = await db
    .select({ userId: agentKeys.userId })
    .from(agentKeys)
    .where(eq(agentKeys.id, agentKeyId))
    .limit(1);

  const key = row[0];
  if (!key) {
    return { ok: false, reason: "Agent key not found." };
  }

  return setUserAvatar(key.userId, buffer, contentType);
}

export async function getUserAvatar(
  userId: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const row = await db
    .select({
      avatarContentType: users.avatarContentType,
      avatarData: users.avatarData,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = row[0];
  if (!user?.avatarData || !user.avatarContentType) return null;

  return {
    buffer: Buffer.from(user.avatarData, "base64"),
    contentType: user.avatarContentType,
  };
}

export async function getAgentAvatar(
  agentKeyId: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const row = await db
    .select({ userId: agentKeys.userId })
    .from(agentKeys)
    .where(eq(agentKeys.id, agentKeyId))
    .limit(1);

  const key = row[0];
  if (!key) return null;
  return getUserAvatar(key.userId);
}

/** Copy legacy per-key avatars onto user rows (idempotent). */
export async function backfillUserAvatarsFromAgentKeys() {
  const keys = await db
    .select({
      userId: agentKeys.userId,
      avatarContentType: agentKeys.avatarContentType,
      avatarData: agentKeys.avatarData,
      lastUsedAt: agentKeys.lastUsedAt,
      createdAt: agentKeys.createdAt,
    })
    .from(agentKeys)
    .orderBy(desc(agentKeys.lastUsedAt), desc(agentKeys.createdAt));

  const bestByUser = new Map<
    string,
    { avatarContentType: string; avatarData: string }
  >();

  for (const key of keys) {
    if (!key.avatarContentType || !key.avatarData) continue;
    if (!bestByUser.has(key.userId)) {
      bestByUser.set(key.userId, {
        avatarContentType: key.avatarContentType,
        avatarData: key.avatarData,
      });
    }
  }

  for (const [userId, avatar] of bestByUser) {
    const existing = await db
      .select({
        avatarContentType: users.avatarContentType,
        avatarData: users.avatarData,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existing[0]?.avatarData && existing[0]?.avatarContentType) continue;

    await db
      .update(users)
      .set({
        avatarContentType: avatar.avatarContentType,
        avatarData: avatar.avatarData,
      })
      .where(eq(users.id, userId));
  }
}
