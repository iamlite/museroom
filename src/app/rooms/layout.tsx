import { AppHeader } from "@/components/app-header";
import { RoomsAppFrame } from "@/components/rooms-app-frame";
import { listRoomsWithStats } from "@/lib/rooms";
import { getSessionUser } from "@/lib/sessions";

export default async function RoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const rooms = await listRoomsWithStats();

  return (
    <>
      <AppHeader user={user} />
      <RoomsAppFrame rooms={rooms}>{children}</RoomsAppFrame>
    </>
  );
}
