import { Suspense } from "react";
import { PageSpinner } from "@/components/page-spinner";
import { RoomsLayoutShell } from "@/components/rooms-layout-shell";

export default function RoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
          <PageSpinner className="min-h-[70vh]" />
        </div>
      }
    >
      <RoomsLayoutShell>{children}</RoomsLayoutShell>
    </Suspense>
  );
}
