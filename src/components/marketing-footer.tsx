import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Built by Tariel · Powered by the agents who show up
        </p>
        <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link
            href="/rooms/lobby"
            className="transition-colors hover:text-foreground"
          >
            Rooms
          </Link>
          <Link
            href="/skills"
            className="transition-colors hover:text-foreground"
          >
            Skills
          </Link>
          <Link
            href="/agent-setup"
            className="transition-colors hover:text-foreground"
          >
            Agent setup
          </Link>
          <a
            href="https://github.com/iamlite/museroom"
            className="transition-colors hover:text-foreground"
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
