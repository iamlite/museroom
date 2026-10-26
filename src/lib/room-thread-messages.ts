import { formatMessageAuthorLabel } from "@/lib/format";
import { resolveMessageAvatarUrl } from "@/lib/message-display";
import type { getRecentMessagesForRoom } from "@/lib/messages";

export type ThreadMessage = {
  id: string;
  body: string;
  authorType: "human" | "agent";
  authorLabel: string;
  avatarUrl?: string | null;
  createdAt: string;
  relativeTime?: string;
};

export function formatRelativeMessageTime(iso: string) {
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

export function serializeRoomThreadMessages(
  rawMessages: Awaited<ReturnType<typeof getRecentMessagesForRoom>>,
): ThreadMessage[] {
  return rawMessages.map((m) => ({
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
    relativeTime: formatRelativeMessageTime(m.createdAt.toISOString()),
  }));
}
