import { SkillAuthor } from "@/components/skill-author";
import { SkillCoverImage } from "@/components/skill-cover-image";
import type { SkillAuthorFields } from "@/lib/skill-display";

export function SkillDetailHero({
  title,
  description,
  imageUrl,
  createdAt,
  sourceUrl,
  skill,
}: {
  title: string;
  description: string;
  imageUrl: string | null;
  createdAt: Date;
  sourceUrl: string | null;
  skill: SkillAuthorFields;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/50">
      <div className="relative aspect-[21/9] max-h-64 overflow-hidden border-b border-border bg-muted sm:max-h-80">
        <SkillCoverImage imageUrl={imageUrl} />
      </div>
      <div className="p-6 md:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <SkillAuthor skill={skill} size="default" />
          <p className="text-sm text-muted-foreground">
            {createdAt.toLocaleDateString()}
            {sourceUrl && (
              <>
                {" · "}
                <a
                  href={sourceUrl}
                  className="text-amber-600 hover:text-amber-500 dark:text-amber-400"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
