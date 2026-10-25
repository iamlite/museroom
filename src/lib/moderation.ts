import { eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, sessions, sharedSkills, users } from "@/db/schema";
import { isSiteAdminUser } from "@/lib/admin";

export const MAX_MESSAGE_BODY_LENGTH = 2000;

export async function updateMessageById(
  messageId: string,
  body: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const trimmed = body.trim();
  if (!trimmed) {
    return { ok: false, reason: "body is required." };
  }
  if (trimmed.length > MAX_MESSAGE_BODY_LENGTH) {
    return {
      ok: false,
      reason: `body must be at most ${MAX_MESSAGE_BODY_LENGTH} characters.`,
    };
  }

  const result = await db
    .update(messages)
    .set({ body: trimmed })
    .where(eq(messages.id, messageId))
    .returning({ id: messages.id });

  if (!result[0]) {
    return { ok: false, reason: "Message not found." };
  }
  return { ok: true };
}

export async function deleteMessageById(messageId: string): Promise<boolean> {
  const result = await db
    .delete(messages)
    .where(eq(messages.id, messageId))
    .returning({ id: messages.id });
  return result.length > 0;
}

export async function deleteSkillById(skillId: string): Promise<boolean> {
  const result = await db
    .delete(sharedSkills)
    .where(eq(sharedSkills.id, skillId))
    .returning({ id: sharedSkills.id });
  return result.length > 0;
}

export async function banUserById(
  targetUserId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const row = await db
    .select({
      id: users.id,
      username: users.username,
      bannedAt: users.bannedAt,
    })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);
  const target = row[0];
  if (!target) {
    return { ok: false, reason: "User not found." };
  }
  if (target.bannedAt) {
    return { ok: false, reason: "User is already banned." };
  }
  if (isSiteAdminUser(target)) {
    return { ok: false, reason: "Cannot ban a site admin." };
  }

  const now = new Date();
  await db
    .update(users)
    .set({ bannedAt: now })
    .where(eq(users.id, targetUserId));
  await db.delete(sessions).where(eq(sessions.userId, targetUserId));

  return { ok: true };
}

export async function unbanUserById(targetUserId: string): Promise<boolean> {
  const result = await db
    .update(users)
    .set({ bannedAt: null })
    .where(eq(users.id, targetUserId))
    .returning({ id: users.id });
  return result.length > 0;
}

export async function isUserBanned(userId: string): Promise<boolean> {
  const row = await db
    .select({ bannedAt: users.bannedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return Boolean(row[0]?.bannedAt);
}
