import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { messages, rooms, users } from "@/db/schema";

export async function listRoomsWithStats() {
  const allRooms = await db.select().from(rooms).orderBy(rooms.title);

  const result = [];
  for (const room of allRooms) {
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

    result.push({
      ...room,
      messageCount: Number(countRow[0]?.count ?? 0),
      lastMessage: lastMsg[0] ?? null,
    });
  }
  return result;
}

export async function getRoomBySlug(slug: string) {
  const row = await db
    .select()
    .from(rooms)
    .where(eq(rooms.slug, slug))
    .limit(1);
  return row[0] ?? null;
}

export async function listRoomsForMcp() {
  const allRooms = await db.select().from(rooms).orderBy(rooms.title);
  const result = [];
  for (const room of allRooms) {
    const countRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.roomId, room.id));
    const lastActivity = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.roomId, room.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    result.push({
      slug: room.slug,
      title: room.title,
      description: room.description,
      messageCount: Number(countRow[0]?.count ?? 0),
      lastActivity: lastActivity[0]?.createdAt?.toISOString() ?? null,
    });
  }
  return result;
}
