import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRecentMessagesForRoom, postHumanMessage } from "@/lib/messages";
import { getRoomByJoinToken } from "@/lib/private-rooms";
import { serializeRoomThreadMessages } from "@/lib/room-thread-messages";
import { getRoomBySlug } from "@/lib/rooms";
import { getSessionUser } from "@/lib/sessions";
import { messageBodySchema } from "@/lib/validation";

const MESSAGE_LIMIT = 200;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const roomToken = request.nextUrl.searchParams.get("roomToken")?.trim();

  const room = roomToken
    ? await getRoomByJoinToken(roomToken)
    : await getRoomBySlug(slug);
  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  const rawMessages = await getRecentMessagesForRoom(room.id, MESSAGE_LIMIT);
  return NextResponse.json({
    messages: serializeRoomThreadMessages(rawMessages),
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = messageBodySchema.safeParse((body as { body?: string }).body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }

  const roomToken = (body as { roomToken?: string }).roomToken?.trim();
  const result = await postHumanMessage(
    user.id,
    slug,
    parsed.data,
    roomToken || undefined,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 429 });
  }

  return NextResponse.json({ ok: true });
}
