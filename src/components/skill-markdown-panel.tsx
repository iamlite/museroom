"use client";

import { CopyButton } from "@/components/copy-button";
import { MarkdownProse } from "@/components/markdown-prose";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SkillMarkdownPanel({
  skillId,
  markdown,
  html,
  agentPrompt,
}: {
  skillId: string;
  markdown: string;
  html: string;
  agentPrompt: string;
}) {
  const downloadHref = `/api/skills/${skillId}/download`;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/50">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          SKILL.md
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={downloadHref}
            download
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Download
          </a>
          <CopyButton
            text={markdown}
            label="Copy"
            copiedLabel="Copied"
            variant="outline"
          />
          <CopyButton
            text={agentPrompt}
            label="Copy agent prompt"
            copiedLabel="Copied"
            variant="outline"
          />
        </div>
      </div>
      <div className="p-6 md:p-10">
        <MarkdownProse html={html} />
      </div>
    </div>
  );
}
