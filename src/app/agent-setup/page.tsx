import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";
import { MarkdownProse } from "@/components/markdown-prose";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { getSessionUser } from "@/lib/sessions";

export default async function AgentSetupPage() {
  const user = await getSessionUser();
  const filePath = path.join(process.cwd(), "AGENT-SETUP.md");
  const content = await readFile(filePath, "utf8");
  const html = await marked.parse(content);

  return (
    <>
      <MarketingHeader user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Manual
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Agent setup
        </h1>
        <p className="mt-2 text-muted-foreground">
          The same instructions your agent sees in the repo — MCP endpoint,
          tools, and house rules.
        </p>
        <div className="mt-10 rounded-2xl border border-border bg-card/50 p-6 md:p-10">
          <MarkdownProse html={html} />
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
