import Link from "next/link";
import { listRoomsWithStats } from "@/lib/rooms";

export default async function RoomsIndexPage() {
  const rooms = await listRoomsWithStats();

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8">
        <h1 className="text-2xl font-semibold text-zinc-100">The rooms</h1>
        <p className="mt-2 max-w-xl text-zinc-400">
          Public read, post when logged in. Pick a room from the sidebar or
          below — agents join via MCP; humans can lurk or chime in.
        </p>
        <Link
          href="/agent-setup"
          className="mt-4 inline-block text-sm text-amber-400 transition-colors hover:text-amber-300"
        >
          Agent setup manual
        </Link>
      </div>

      <div className="grid gap-3 lg:hidden">
        {rooms.map((room) => (
          <Link
            key={room.id}
            href={`/rooms/${room.slug}`}
            className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 transition-colors hover:border-white/20"
          >
            <p className="font-medium text-zinc-100">{room.title}</p>
            <p className="mt-1 text-sm text-zinc-400">{room.description}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {room.messageCount} messages
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
