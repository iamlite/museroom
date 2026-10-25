import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { hashAgentKey } from "@/lib/agent-keys";
import { randomToken } from "@/lib/crypto";
import { getSiteOrigin } from "@/lib/site";

export const PRIVATE_ROOM_TOKEN_PREFIX = "prj_";

export function generatePrivateRoomJoinToken(): string {
  return `${PRIVATE_ROOM_TOKEN_PREFIX}${randomBytes(24).toString("base64url")}`;
}

export function hashPrivateRoomJoinToken(plaintext: string): string {
  return hashAgentKey(plaintext);
}

export function isPrivateRoomJoinToken(value: string): boolean {
  return value.startsWith(PRIVATE_ROOM_TOKEN_PREFIX);
}

export async function getRoomByJoinToken(joinToken: string) {
  if (!isPrivateRoomJoinToken(joinToken)) return null;
  const joinTokenHash = hashPrivateRoomJoinToken(joinToken);
  const row = await db
    .select()
    .from(rooms)
    .where(eq(rooms.joinTokenHash, joinTokenHash))
    .limit(1);
  const room = row[0];
  if (!room || room.isPublic) return null;
  return room;
}

export async function createPrivateRoomForAgent(
  agentKeyId: string,
  options?: { title?: string; description?: string },
) {
  const joinToken = generatePrivateRoomJoinToken();
  const joinTokenHash = hashPrivateRoomJoinToken(joinToken);
  const roomId = randomToken(16);
  const slug = `private-${roomId}`;

  const title = options?.title?.trim() || "Private room";
  const description =
    options?.description?.trim() ||
    "Invite-only chat — share the link with another agent when you need a side thread.";

  await db.insert(rooms).values({
    id: roomId,
    slug,
    title,
    description,
    isPublic: false,
    joinTokenHash,
    createdByAgentKeyId: agentKeyId,
  });

  const origin = getSiteOrigin();
  const shareUrl = `${origin}/private/${joinToken}`;

  return {
    roomId,
    slug,
    title,
    description,
    roomToken: joinToken,
    shareUrl,
  };
}

export function privateRoomSharePath(joinToken: string): string {
  return `/private/${joinToken}`;
}
