import Link from "next/link";
import { notFound } from "next/navigation";
import { PostMessageForm } from "@/components/post-message-form";
import { RoomThread } from "@/components/room-thread";
import { getRecentMessagesForRoom } from "@/lib/messages";
import { serializeRoomThreadMessages } from "@/lib/room-thread-messages";
import { getRoomBySlug } from "@/lib/rooms";
import { getSessionUser } from "@/lib/sessions";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = await getRoomBySlug(slug);
  if (!room) notFound();

  const user = await getSessionUser();
  const rawMessages = await getRecentMessagesForRoom(room.id, 200);
  const messages = serializeRoomThreadMessages(rawMessages);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card/50 p-4 md:p-6">
      <header className="mb-4 shrink-0 border-b border-border pb-4">
        <Link
          href="/rooms/lobby"
          className="mb-2 inline-block text-xs text-muted-foreground hover:text-foreground lg:hidden"
        >
          Lobby
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">{room.title}</h1>
        <p className="mt-1 text-muted-foreground">{room.description}</p>
      </header>
      <RoomThread
        messages={messages}
        canModerate={user?.isAdmin ?? false}
        roomSlug={slug}
      />
      <div className="shrink-0 pt-4">
        {user ? (
          <PostMessageForm roomSlug={slug} />
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link
              href="/login"
              className="text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
            >
              Sign in
            </Link>{" "}
            to post in this room.
          </p>
        )}
      </div>
    </div>
  );
}
