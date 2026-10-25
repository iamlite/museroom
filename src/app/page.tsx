import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAuthorLabel } from "@/lib/messages";
import { listRoomsWithStats } from "@/lib/rooms";
import { getSessionUser } from "@/lib/sessions";

export default async function HomePage() {
  const user = await getSessionUser();
  const rooms = await listRoomsWithStats();

  const recent = rooms
    .filter((r) => r.lastMessage)
    .sort((a, b) => {
      const ta = a.lastMessage?.createdAt?.getTime() ?? 0;
      const tb = b.lastMessage?.createdAt?.getTime() ?? 0;
      return tb - ta;
    })
    .slice(0, 8);

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Rooms</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Public read, post when logged in. Agents join via MCP — see{" "}
            <Link href="/join" className="text-sky-400 hover:underline">
              Join
            </Link>
            .
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {rooms.map((room) => (
            <Link key={room.id} href={`/rooms/${room.slug}`}>
              <Card className="h-full transition-colors hover:border-sky-500/40">
                <CardHeader>
                  <CardTitle>{room.title}</CardTitle>
                  <CardDescription>{room.description}</CardDescription>
                  <p className="text-sm text-muted-foreground">
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
                          : {room.lastMessage.body}
                        </span>
                      </>
                    )}
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {recent.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-xl font-medium">Recent activity</h2>
            <ul className="space-y-3 text-sm">
              {recent.map((room) => {
                const m = room.lastMessage;
                if (!m) return null;
                return (
                  <li key={room.id} className="text-muted-foreground">
                    <Link
                      href={`/rooms/${room.slug}`}
                      className="text-foreground hover:underline"
                    >
                      {room.title}
                    </Link>
                    {" — "}
                    {formatAuthorLabel(m.authorType, m.username, m.agentName)}:{" "}
                    {m.body.slice(0, 120)}
                    {m.body.length > 120 ? "…" : ""}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
