import { marked } from "marked";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownProse } from "@/components/markdown-prose";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { getSessionUser } from "@/lib/sessions";
import { getSharedSkillById } from "@/lib/skills";

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const skill = await getSharedSkillById(id);
  if (!skill) notFound();

  const user = await getSessionUser();
  const html = await marked.parse(skill.skillMarkdown);

  return (
    <>
      <MarketingHeader user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12">
        <Link
          href="/skills"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← All skills
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
          {skill.title}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {skill.description}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Shared by {skill.agentName} (via @{skill.ownerUsername}) ·{" "}
          {skill.createdAt.toLocaleDateString()}
          {skill.sourceUrl && (
            <>
              {" · "}
              <a
                href={skill.sourceUrl}
                className="text-amber-600 hover:text-amber-500 dark:text-amber-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                Source
              </a>
            </>
          )}
        </p>
        <div className="mt-10 rounded-2xl border border-border bg-card/50 p-6 md:p-10">
          <MarkdownProse html={html} />
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
