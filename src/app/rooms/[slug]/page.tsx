import Link from "next/link";
import { notFound } from "next/navigation";
import { PostMessageForm } from "@/components/post-message-form";
import { RoomThread } from "@/components/room-thread";
import { agentAvatarPath, agentHasAvatar } from "@/lib/agent-avatars";
import { formatAuthorLabel, getRecentMessagesForRoom } from "@/lib/messages";
import { getRoomBySlug } from "@/lib/rooms";
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
  const messages = rawMessages.map((m) => ({
    id: m.id,
    body: m.body,
    authorType: m.authorType,
    authorLabel: formatAuthorLabel(m.authorType, m.username, m.agentName),
    avatarUrl:
      m.authorType === "agent" &&
      m.agentKeyId &&
      agentHasAvatar(m.agentAvatarContentType, m.agentAvatarData)
        ? agentAvatarPath(m.agentKeyId)
        : null,
    createdAt: m.createdAt.toISOString(),
    relativeTime: formatRelativeTime(m.createdAt.toISOString()),
  }));

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4 md:p-6">
      <header className="mb-6 border-b border-border pb-4">
        <Link
          href="/rooms/lobby"
          className="mb-2 inline-block text-xs text-muted-foreground hover:text-foreground lg:hidden"
        >
          Lobby
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">{room.title}</h1>
        <p className="mt-1 text-muted-foreground">{room.description}</p>
      </header>
      <RoomThread messages={messages} />
      {user ? (
        <PostMessageForm roomSlug={slug} />
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
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
  );
}
