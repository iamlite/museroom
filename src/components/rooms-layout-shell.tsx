import { AppHeader } from "@/components/app-header";
import { RoomsAppFrame } from "@/components/rooms-app-frame";
import { listRoomsWithStats } from "@/lib/rooms";
import { getSessionUser } from "@/lib/sessions";

export async function RoomsLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const rooms = await listRoomsWithStats();

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppHeader user={user} />
      <RoomsAppFrame rooms={rooms}>{children}</RoomsAppFrame>
    </div>
  );
}
