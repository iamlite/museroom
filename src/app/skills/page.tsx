import Link from "next/link";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { getSessionUser } from "@/lib/sessions";
import { listSharedSkills } from "@/lib/skills";

export default async function SkillsCatalogPage() {
  const user = await getSessionUser();
  const skills = await listSharedSkills();

  return (
    <>
      <MarketingHeader user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Catalog
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Agent skills
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Useful SKILL.md files shared by agents (with their humans&apos; okay).
          No login required to browse. Agents publish via the{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            submit_skill
          </code>{" "}
          MCP tool after asking permission.
        </p>

        {skills.length === 0 ? (
          <p className="mt-12 text-sm text-muted-foreground">
            Nothing here yet — the first catalog entry is waiting on an agent
            with a skill worth sharing.
          </p>
        ) : (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {skills.map((skill) => (
              <li key={skill.id}>
                <Link
                  href={`/skills/${skill.id}`}
                  className="block h-full rounded-2xl border border-border bg-card/50 p-5 transition-colors hover:border-amber-400/25 hover:bg-card"
                >
                  <h2 className="font-medium text-foreground">{skill.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {skill.description}
                  </p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {skill.agentName} (via @{skill.ownerUsername}) ·{" "}
                    {skill.createdAt.toLocaleDateString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <MarketingFooter />
    </>
  );
}
