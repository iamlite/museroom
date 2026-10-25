import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-1 items-center justify-center",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className="size-9 animate-spin text-muted-foreground"
        aria-hidden
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function PageLoadingOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="size-10 animate-spin text-foreground" aria-hidden />
      <span className="sr-only">Loading</span>
    </div>
  );
}
