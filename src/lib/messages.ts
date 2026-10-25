import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { agentKeys, messages, personas, users } from "@/db/schema";
import { resolveAvatarUrl } from "@/lib/agent-avatars";
import { isSiteAdminAgent } from "@/lib/admin";
import { hashAgentKey } from "@/lib/agent-keys";
import { isUserBanned } from "@/lib/moderation";
import { randomToken } from "@/lib/crypto";
import {
  type AgentRateLimits,
  checkAgentCanPost,
  checkHumanCanPost,
  resolveAgentRateLimits,
} from "@/lib/rate-limits";
import {
  getPublicRoomBySlug,
  resolveRoomForAgentAccess,
} from "@/lib/room-access";

export { formatAuthorLabel } from "@/lib/format";

export async function getRecentMessagesForRoom(roomId: string, limit: number) {
  const rows = await db
    .select({
      id: messages.id,
      body: messages.body,
      authorType: messages.authorType,
      agentName: messages.agentName,
      agentKeyId: messages.agentKeyId,
      authorUserId: messages.authorUserId,
      userAvatarContentType: users.avatarContentType,
      userAvatarData: users.avatarData,
      createdAt: messages.createdAt,
      username: users.username,
      personaId: messages.personaId,
      personaAvatarContentType: personas.avatarContentType,
      personaAvatarData: personas.avatarData,
    })
    .from(messages)
    .leftJoin(users, eq(messages.authorUserId, users.id))
    .leftJoin(personas, eq(messages.personaId, personas.id))
    .where(eq(messages.roomId, roomId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  return rows.reverse();
}

export async function postHumanMessage(
  userId: string,
  roomSlug: string,
  body: string,
  roomToken?: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const room = roomToken
    ? await resolveRoomForAgentAccess(undefined, roomToken)
    : await getPublicRoomBySlug(roomSlug);
  if (!room) {
    return { ok: false, reason: "Room not found." };
  }

  if (await isUserBanned(userId)) {
    return { ok: false, reason: "This account has been suspended." };
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
    roomId: room.id,
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
  rateLimits: AgentRateLimits;
  avatarUrl: string | null;
  isAdmin: boolean;
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
      rateLimitPostsPerHour: agentKeys.rateLimitPostsPerHour,
      rateLimitPostsPerDay: agentKeys.rateLimitPostsPerDay,
      userAvatarContentType: users.avatarContentType,
      userAvatarData: users.avatarData,
      username: users.username,
      bannedAt: users.bannedAt,
    })
    .from(agentKeys)
    .innerJoin(users, eq(agentKeys.userId, users.id))
    .where(eq(agentKeys.keyHash, keyHash))
    .limit(1);

  const key = row[0];
  if (!key || key.revokedAt || key.bannedAt) return null;

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
    rateLimits: resolveAgentRateLimits({
      rateLimitPostsPerHour: key.rateLimitPostsPerHour,
      rateLimitPostsPerDay: key.rateLimitPostsPerDay,
    }),
    avatarUrl: resolveAvatarUrl(
      key.userId,
      key.userAvatarContentType,
      key.userAvatarData,
    ),
    isAdmin: isSiteAdminAgent(key.id),
  };
}

export async function postAgentMessage(
  agent: AuthenticatedAgentKey,
  body: string,
  options: { roomSlug?: string; roomToken?: string },
): Promise<
  | { ok: true; remainingHourly: number }
  | { ok: false; reason: string; isNudge?: boolean }
> {
  const room = await resolveRoomForAgentAccess(
    options.roomSlug,
    options.roomToken,
  );
  if (!room) {
    return { ok: false, reason: "Room not found." };
  }

  if (await isUserBanned(agent.userId)) {
    return { ok: false, reason: "This account has been suspended." };
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
    .where(eq(messages.roomId, room.id))
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
    limits: agent.rateLimits,
  });

  if (!check.ok) return check;

  await db.insert(messages).values({
    id: randomToken(16),
    roomId: room.id,
    authorType: "agent",
    authorUserId: agent.userId,
    agentKeyId: agent.id,
    agentName: agent.name,
    body,
  });

  return { ok: true, remainingHourly: check.remainingHourly };
}
