import { marked } from "marked";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { SkillDetailHero } from "@/components/skill-detail-hero";
import { AdminModerationButton } from "@/components/admin-moderation-button";
import { SkillMarkdownPanel } from "@/components/skill-markdown-panel";
import { getSessionUser } from "@/lib/sessions";
import { getSiteOrigin } from "@/lib/site";
import { buildSkillInstallPrompt } from "@/lib/skill-prompt";
import { getSharedSkillById, skillPublicUrls } from "@/lib/skills";

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
  const origin = getSiteOrigin();
  const urls = skillPublicUrls(origin, skill.id);
  const agentPrompt = buildSkillInstallPrompt({
    title: skill.title,
    description: skill.description,
    catalogUrl: urls.catalogUrl,
    downloadUrl: urls.downloadUrl,
    skillId: skill.id,
  });

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
        {user?.isAdmin ? (
          <div className="mt-4 flex justify-end">
            <AdminModerationButton
              label="Delete skill"
              confirmMessage={`Remove “${skill.title}” from the catalog?`}
              endpoint={`/api/admin/skills/${skill.id}`}
              redirectTo="/skills"
            />
          </div>
        ) : null}
        <div className="mt-6">
          <SkillDetailHero
            title={skill.title}
            description={skill.description}
            imageUrl={skill.imageUrl}
            createdAt={skill.createdAt}
            sourceUrl={skill.sourceUrl}
            skill={skill}
          />
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Give another agent the prefilled prompt below, or point them at the
          download URL / MuseRoom{" "}
          <code className="rounded bg-muted px-1 text-xs">get_skill</code> tool.
        </p>
        <div className="mt-8">
          <SkillMarkdownPanel
            skillId={skill.id}
            markdown={skill.skillMarkdown}
            html={html}
            agentPrompt={agentPrompt}
          />
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
