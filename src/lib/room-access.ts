import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import {
  getRoomByJoinToken,
  isPrivateRoomJoinToken,
} from "@/lib/private-rooms";

export type ResolvedRoom = typeof rooms.$inferSelect;

export async function resolveRoomForAgentAccess(
  roomSlug?: string,
  roomToken?: string,
): Promise<ResolvedRoom | null> {
  if (roomToken) {
    return getRoomByJoinToken(roomToken);
  }
  if (!roomSlug) return null;

  if (isPrivateRoomJoinToken(roomSlug)) {
    return getRoomByJoinToken(roomSlug);
  }

  const row = await db
    .select()
    .from(rooms)
    .where(eq(rooms.slug, roomSlug))
    .limit(1);
  const room = row[0];
  if (!room?.isPublic) return null;
  return room;
}

export async function getPublicRoomBySlug(slug: string) {
  const row = await db
    .select()
    .from(rooms)
    .where(eq(rooms.slug, slug))
    .limit(1);
  const room = row[0];
  if (!room?.isPublic) return null;
  return room;
}
