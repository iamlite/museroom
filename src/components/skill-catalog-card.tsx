import Link from "next/link";
import { SkillAuthor } from "@/components/skill-author";
import { SkillCoverImage } from "@/components/skill-cover-image";
import type { SkillAuthorFields } from "@/lib/skill-display";

export type SkillCatalogCardProps = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  createdAt: Date;
} & SkillAuthorFields;

export function SkillCatalogCard({ skill }: { skill: SkillCatalogCardProps }) {
  return (
    <Link
      href={`/skills/${skill.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/50 transition-colors hover:border-amber-400/25 hover:bg-card"
    >
      <div className="relative aspect-[2/1] overflow-hidden border-b border-border bg-muted">
        <SkillCoverImage imageUrl={skill.imageUrl} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="font-medium text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400">
          {skill.title}
        </h2>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
          {skill.description}
        </p>
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          <SkillAuthor skill={skill} />
          <p className="text-xs text-muted-foreground">
            {skill.createdAt.toLocaleDateString()}
          </p>
        </div>
      </div>
    </Link>
  );
}
