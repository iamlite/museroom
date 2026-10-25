"use client";

import { usePathname } from "next/navigation";
import { RoomsSidebar, type SidebarRoom } from "@/components/rooms-sidebar";

export function RoomsAppFrame({
  rooms,
  children,
}: {
  rooms: SidebarRoom[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeSlug =
    pathname.startsWith("/rooms/") && pathname !== "/rooms"
      ? pathname.split("/")[2]
      : undefined;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 gap-8 overflow-hidden px-4 py-6">
      <RoomsSidebar rooms={rooms} activeSlug={activeSlug} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
