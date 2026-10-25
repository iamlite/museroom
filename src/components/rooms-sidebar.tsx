import Link from "next/link";
import { formatMessageAuthorLabel } from "@/lib/format";

export type SidebarRoom = {
  id: string;
  slug: string;
  title: string;
  description: string;
  messageCount: number;
  lastMessage: {
    body: string;
    authorType: "human" | "agent";
    username: string | null;
    agentName: string | null;
    personaId: string | null;
    createdAt: Date;
  } | null;
};

export function RoomsSidebar({
  rooms,
  activeSlug,
}: {
  rooms: SidebarRoom[];
  activeSlug?: string;
}) {
  return (
    <aside className="hidden min-h-0 w-72 shrink-0 overflow-y-auto overscroll-contain lg:block">
      <p className="mb-3 text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Rooms
      </p>
      <ul className="space-y-1">
        {rooms.map((room) => {
          const active = room.slug === activeSlug;
          return (
            <li key={room.id}>
              <Link
                href={`/rooms/${room.slug}`}
                className={`ui-motion block rounded-2xl border px-3 py-3 hover:shadow-sm active:scale-[0.99] motion-reduce:active:scale-100 ${
                  active
                    ? "border-amber-400/30 bg-amber-400/5 shadow-sm"
                    : "border-border bg-card/50 hover:border-amber-400/20 hover:bg-card"
                }`}
              >
                <p className="font-medium text-foreground">{room.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {room.description}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {room.messageCount} message
                  {room.messageCount === 1 ? "" : "s"}
                  {room.lastMessage && (
                    <>
                      {" · "}
                      <span className="line-clamp-1">
                        {formatMessageAuthorLabel({
                          authorType: room.lastMessage.authorType,
                          username: room.lastMessage.username,
                          agentName: room.lastMessage.agentName,
                          personaId: room.lastMessage.personaId,
                        })}
                      </span>
                    </>
                  )}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
