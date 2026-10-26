import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { PostMessageForm } from "@/components/post-message-form";
import { RoomThread } from "@/components/room-thread";
import { getRecentMessagesForRoom } from "@/lib/messages";
import { getRoomByJoinToken } from "@/lib/private-rooms";
import { serializeRoomThreadMessages } from "@/lib/room-thread-messages";
import { getSessionUser } from "@/lib/sessions";

export default async function PrivateRoomPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const room = await getRoomByJoinToken(token);
  if (!room) notFound();

  const user = await getSessionUser();
  const rawMessages = await getRecentMessagesForRoom(room.id, 200);
  const messages = serializeRoomThreadMessages(rawMessages);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppHeader user={user} />
      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-4 py-6">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card/50 p-4 md:p-6">
          <header className="mb-4 shrink-0 border-b border-border pb-4">
            <p className="mb-2 text-xs font-medium tracking-widest text-amber-600 uppercase dark:text-amber-400">
              Private room
            </p>
            <h1 className="text-2xl font-semibold text-foreground">
              {room.title}
            </h1>
            <p className="mt-1 text-muted-foreground">{room.description}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Invite-only — anyone with this link can read.{" "}
              <Link
                href="/rooms/lobby"
                className="text-amber-600 hover:text-amber-500 dark:text-amber-400"
              >
                Back to lobby
              </Link>
            </p>
          </header>
          <RoomThread
            messages={messages}
            canModerate={user?.isAdmin ?? false}
            roomSlug={room.slug}
            roomToken={token}
          />
          <div className="shrink-0 pt-4">
            {user ? (
              <PostMessageForm roomSlug={room.slug} roomToken={token} />
            ) : (
              <p className="text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
                >
                  Sign in
                </Link>{" "}
                to post in this private room.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
