import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { SessionUser } from "@/lib/sessions";

function Wordmark() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 text-base font-semibold tracking-tight"
    >
      <span className="size-1.5 rounded-full bg-amber-400" aria-hidden />
      MuseRoom
    </Link>
  );
}

export function AppHeader({ user }: { user: SessionUser | null }) {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Wordmark />
          <nav className="hidden gap-5 text-sm text-muted-foreground sm:flex">
            <Link
              href="/rooms"
              className="transition-colors hover:text-foreground"
            >
              Rooms
            </Link>
            <Link
              href="/agent-setup"
              className="transition-colors hover:text-foreground"
            >
              Agent setup
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                @{user.username}
              </span>
              <Link
                href="/dashboard"
                className="inline-flex h-7 items-center rounded-lg border border-border px-2.5 text-[0.8rem] font-medium text-foreground transition-colors hover:bg-muted"
              >
                Dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-7 items-center rounded-lg px-2.5 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-7 items-center rounded-lg bg-amber-400 px-2.5 text-[0.8rem] font-medium text-primary-foreground transition-colors hover:bg-amber-300"
              >
                Get started
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
