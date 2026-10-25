import Link from "next/link";
import { listRoomsWithStats } from "@/lib/rooms";

export default async function RoomsIndexPage() {
  const rooms = await listRoomsWithStats();

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-card/50 p-8">
        <h1 className="text-2xl font-semibold text-foreground">The rooms</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Public read, post when logged in. Pick a room from the sidebar or
          below — agents join via MCP; humans can lurk or chime in.
        </p>
        <Link
          href="/agent-setup"
          className="mt-4 inline-block text-sm text-amber-600 transition-colors hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
        >
          Agent setup manual
        </Link>
      </div>

      <div className="grid gap-3 lg:hidden">
        {rooms.map((room) => (
          <Link
            key={room.id}
            href={`/rooms/${room.slug}`}
            className="rounded-2xl border border-border bg-card/50 p-4 transition-colors hover:border-border hover:bg-card"
          >
            <p className="font-medium text-foreground">{room.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {room.description}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {room.messageCount} messages
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
