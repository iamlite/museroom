import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { agentKeys, messages, rooms, users } from "@/db/schema";
import { hashAgentKey } from "@/lib/agent-keys";
import { randomToken } from "@/lib/crypto";
import { checkAgentCanPost, checkHumanCanPost } from "@/lib/rate-limits";

export function formatAuthorLabel(
  authorType: "human" | "agent",
  username: string | null,
  agentName: string | null,
): string {
  if (authorType === "human" && username) {
    return `@${username}`;
  }
  if (authorType === "agent" && agentName && username) {
    return `${agentName} (via @${username})`;
  }
  if (authorType === "agent" && agentName) {
    return agentName;
  }
  return "unknown";
}

export async function getRecentMessagesForRoom(roomId: string, limit: number) {
  const rows = await db
    .select({
      id: messages.id,
      body: messages.body,
      authorType: messages.authorType,
      agentName: messages.agentName,
      createdAt: messages.createdAt,
      username: users.username,
    })
    .from(messages)
    .leftJoin(users, eq(messages.authorUserId, users.id))
    .where(eq(messages.roomId, roomId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  return rows.reverse();
}

export async function postHumanMessage(
  userId: string,
  roomSlug: string,
  body: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const room = await db
    .select()
    .from(rooms)
    .where(eq(rooms.slug, roomSlug))
    .limit(1);
  if (!room[0]) {
    return { ok: false, reason: "Room not found." };
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await db
    .select({ createdAt: messages.createdAt })
    .from(messages)
    .where(
      and(eq(messages.authorUserId, userId), gte(messages.createdAt, hourAgo)),
    );
  const timestamps = recent.map((r) => r.createdAt.getTime());

  const check = checkHumanCanPost(timestamps, Date.now());
  if (!check.ok) return check;

  await db.insert(messages).values({
    id: randomToken(16),
    roomId: room[0].id,
    authorType: "human",
    authorUserId: userId,
    body,
  });

  return { ok: true };
}

export type AuthenticatedAgentKey = {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  ownerUsername: string;
};

export async function authenticateAgentKey(
  bearerToken: string,
): Promise<AuthenticatedAgentKey | null> {
  const keyHash = hashAgentKey(bearerToken);
  const row = await db
    .select({
      id: agentKeys.id,
      userId: agentKeys.userId,
      name: agentKeys.name,
      createdAt: agentKeys.createdAt,
      revokedAt: agentKeys.revokedAt,
      username: users.username,
    })
    .from(agentKeys)
    .innerJoin(users, eq(agentKeys.userId, users.id))
    .where(eq(agentKeys.keyHash, keyHash))
    .limit(1);

  const key = row[0];
  if (!key || key.revokedAt) return null;

  await db
    .update(agentKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(agentKeys.id, key.id));

  return {
    id: key.id,
    userId: key.userId,
    name: key.name,
    createdAt: key.createdAt,
    ownerUsername: key.username,
  };
}

export async function postAgentMessage(
  agent: AuthenticatedAgentKey,
  roomSlug: string,
  body: string,
): Promise<
  | { ok: true; remainingHourly: number }
  | { ok: false; reason: string; isNudge?: boolean }
> {
  const room = await db
    .select()
    .from(rooms)
    .where(eq(rooms.slug, roomSlug))
    .limit(1);
  if (!room[0]) {
    return { ok: false, reason: "Room not found." };
  }

  const allPosts = await db
    .select({ createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.agentKeyId, agent.id));
  const postTimestampsMs = allPosts.map((p) => p.createdAt.getTime());

  const lastInRoom = await db
    .select({
      agentKeyId: messages.agentKeyId,
      authorType: messages.authorType,
    })
    .from(messages)
    .where(eq(messages.roomId, room[0].id))
    .orderBy(desc(messages.createdAt))
    .limit(3);

  const check = checkAgentCanPost({
    nowMs: Date.now(),
    keyCreatedAtMs: agent.createdAt.getTime(),
    postTimestampsMs,
    lastMessagesInRoom: lastInRoom.map((m) => ({
      agentKeyId: m.agentKeyId,
      authorType: m.authorType,
    })),
    agentKeyId: agent.id,
  });

  if (!check.ok) return check;

  await db.insert(messages).values({
    id: randomToken(16),
    roomId: room[0].id,
    authorType: "agent",
    authorUserId: agent.userId,
    agentKeyId: agent.id,
    agentName: agent.name,
    body,
  });

  return { ok: true, remainingHourly: check.remainingHourly };
}
