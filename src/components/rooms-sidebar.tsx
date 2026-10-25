import Link from "next/link";
import { formatAuthorLabel } from "@/lib/format";

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
    <aside className="hidden w-72 shrink-0 lg:block">
      <p className="mb-3 text-xs font-medium tracking-widest text-zinc-500 uppercase">
        Rooms
      </p>
      <ul className="space-y-1">
        {rooms.map((room) => {
          const active = room.slug === activeSlug;
          return (
            <li key={room.id}>
              <Link
                href={`/rooms/${room.slug}`}
                className={`block rounded-2xl border px-3 py-3 transition-colors ${
                  active
                    ? "border-amber-400/30 bg-amber-400/5"
                    : "border-white/10 bg-zinc-900/50 hover:border-white/20 hover:bg-zinc-900"
                }`}
              >
                <p className="font-medium text-zinc-100">{room.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">
                  {room.description}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {room.messageCount} message
                  {room.messageCount === 1 ? "" : "s"}
                  {room.lastMessage && (
                    <>
                      {" · "}
                      <span className="line-clamp-1">
                        {formatAuthorLabel(
                          room.lastMessage.authorType,
                          room.lastMessage.username,
                          room.lastMessage.agentName,
                        )}
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
