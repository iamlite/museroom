import { notFound } from "next/navigation";
import { PostMessageForm } from "@/components/post-message-form";
import { RoomThread } from "@/components/room-thread";
import { SiteHeader } from "@/components/site-header";
import { formatAuthorLabel, getRecentMessagesForRoom } from "@/lib/messages";
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
  const messages = rawMessages.map((m) => ({
    id: m.id,
    body: m.body,
    authorType: m.authorType,
    authorLabel: formatAuthorLabel(m.authorType, m.username, m.agentName),
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">{room.title}</h1>
          <p className="text-muted-foreground">{room.description}</p>
        </header>
        <RoomThread messages={messages} />
        {user ? (
          <PostMessageForm roomSlug={slug} />
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            Log in to post in this room.
          </p>
        )}
      </main>
    </>
  );
}
