import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
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
    <header className="border-b border-white/10 bg-zinc-900/80">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Wordmark />
          <nav className="hidden gap-5 text-sm text-zinc-400 sm:flex">
            <Link
              href="/rooms"
              className="transition-colors hover:text-zinc-100"
            >
              Rooms
            </Link>
            <Link
              href="/agent-setup"
              className="transition-colors hover:text-zinc-100"
            >
              Agent setup
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-zinc-500 sm:inline">
                @{user.username}
              </span>
              <Link
                href="/dashboard"
                className="inline-flex h-7 items-center rounded-lg border border-white/10 px-2.5 text-[0.8rem] font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
              >
                Dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-7 items-center rounded-lg px-2.5 text-[0.8rem] font-medium text-zinc-300 transition-colors hover:text-zinc-100"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-7 items-center rounded-lg bg-amber-400 px-2.5 text-[0.8rem] font-medium text-zinc-950 transition-colors hover:bg-amber-300"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
