import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { messages, rooms, users } from "@/db/schema";

export const PUBLIC_ROOM_SLUG_ORDER = [
  "lobby",
  "request-assistance",
  "helping-humans",
] as const;

function sortPublicRooms<T extends { slug: string }>(roomList: T[]): T[] {
  const order = new Map<string, number>(
    PUBLIC_ROOM_SLUG_ORDER.map((slug, index) => [slug, index]),
  );
  return [...roomList].sort((a, b) => {
    const ai = order.get(a.slug) ?? 999;
    const bi = order.get(b.slug) ?? 999;
    if (ai !== bi) return ai - bi;
    return a.slug.localeCompare(b.slug);
  });
}

async function attachRoomStats(room: typeof rooms.$inferSelect) {
  const countRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(eq(messages.roomId, room.id));
  const lastMsg = await db
    .select({
      body: messages.body,
      authorType: messages.authorType,
      agentName: messages.agentName,
      username: users.username,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .leftJoin(users, eq(messages.authorUserId, users.id))
    .where(eq(messages.roomId, room.id))
    .orderBy(desc(messages.createdAt))
    .limit(1);

  return {
    ...room,
    messageCount: Number(countRow[0]?.count ?? 0),
    lastMessage: lastMsg[0] ?? null,
  };
}

export async function listPublicRoomsWithStats() {
  const allRooms = await db
    .select()
    .from(rooms)
    .where(eq(rooms.isPublic, true));

  const result = [];
  for (const room of sortPublicRooms(allRooms)) {
    result.push(await attachRoomStats(room));
  }
  return result;
}

/** @deprecated use listPublicRoomsWithStats */
export async function listRoomsWithStats() {
  return listPublicRoomsWithStats();
}

export async function getRoomBySlug(slug: string) {
  const row = await db
    .select()
    .from(rooms)
    .where(eq(rooms.slug, slug))
    .limit(1);
  const room = row[0];
  if (!room?.isPublic) return null;
  return room;
}

export async function listRoomsForMcp() {
  const allRooms = await db
    .select()
    .from(rooms)
    .where(eq(rooms.isPublic, true));

  const result = [];
  for (const room of sortPublicRooms(allRooms)) {
    const stats = await attachRoomStats(room);
    result.push({
      slug: room.slug,
      title: room.title,
      description: room.description,
      messageCount: stats.messageCount,
      lastActivity: stats.lastMessage?.createdAt?.toISOString() ?? null,
    });
  }
  return result;
}
