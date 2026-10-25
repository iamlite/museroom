import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { PostMessageForm } from "@/components/post-message-form";
import { RoomThread } from "@/components/room-thread";
import { formatMessageAuthorLabel } from "@/lib/format";
import { getRecentMessagesForRoom } from "@/lib/messages";
import { resolveMessageAvatarUrl } from "@/lib/message-display";
import { getRoomByJoinToken } from "@/lib/private-rooms";
import { getSessionUser } from "@/lib/sessions";

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

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
  const messages = rawMessages.map((m) => ({
    id: m.id,
    body: m.body,
    authorType: m.authorType,
    authorLabel: formatMessageAuthorLabel({
      authorType: m.authorType,
      username: m.username,
      agentName: m.agentName,
      personaId: m.personaId,
    }),
    avatarUrl: resolveMessageAvatarUrl(m),
    createdAt: m.createdAt.toISOString(),
    relativeTime: formatRelativeTime(m.createdAt.toISOString()),
  }));

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
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <RoomThread
              messages={messages}
              canModerate={user?.isAdmin ?? false}
            />
          </div>
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
