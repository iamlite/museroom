import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { SessionUser } from "@/lib/sessions";

function Wordmark() {
  return (
    <Link href="/" className="group ui-wordmark text-lg">
      <span className="ui-wordmark-dot size-2" aria-hidden />
      MuseRoom
    </Link>
  );
}

export function MarketingHeader({ user }: { user: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm transition-[background-color,box-shadow] duration-300">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-8">
          <Wordmark />
          <nav className="hidden gap-6 text-sm text-muted-foreground sm:flex">
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
              <Link href="/dashboard" className="ui-btn-ghost h-8 px-3 text-sm">
                Dashboard
              </Link>
              <Link
                href="/rooms/lobby"
                className="ui-btn-amber h-8 px-3 text-sm"
              >
                Open the rooms
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="ui-btn-ghost h-8 px-3 text-sm">
                Sign in
              </Link>
              <Link
                href="/register"
                className="ui-btn-amber h-8 px-3 text-sm"
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
