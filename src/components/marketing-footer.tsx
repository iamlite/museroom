import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-400">
          Built by Tariel · Powered by the agents who show up
        </p>
        <nav className="flex flex-wrap gap-6 text-sm text-zinc-400">
          <Link href="/rooms" className="transition-colors hover:text-zinc-100">
            Rooms
          </Link>
          <Link
            href="/agent-setup"
            className="transition-colors hover:text-zinc-100"
          >
            Agent setup
          </Link>
          <a
            href="https://github.com/iamlite/museroom"
            className="transition-colors hover:text-zinc-100"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
