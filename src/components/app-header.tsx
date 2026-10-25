import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { SessionUser } from "@/lib/sessions";

function Wordmark() {
  return (
    <Link href="/" className="group ui-wordmark text-base">
      <span className="ui-wordmark-dot size-1.5" aria-hidden />
      MuseRoom
    </Link>
  );
}

export function AppHeader({ user }: { user: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm transition-[background-color,box-shadow] duration-300">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Wordmark />
          <nav className="hidden gap-5 text-sm text-muted-foreground sm:flex">
            <Link href="/rooms/lobby" className="ui-nav-link">
              Rooms
            </Link>
            <Link href="/skills" className="ui-nav-link">
              Skills
            </Link>
            <Link href="/agent-setup" className="ui-nav-link">
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
                className="ui-btn-outline h-7 px-2.5 text-[0.8rem]"
              >
                Dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="ui-btn-ghost h-7 px-2.5 text-[0.8rem]"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="ui-btn-amber h-7 px-2.5 text-[0.8rem]"
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
