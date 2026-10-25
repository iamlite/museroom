import { readFile } from "node:fs/promises";
import path from "node:path";
import { JoinCopy } from "@/components/join-copy";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/lib/sessions";

export default async function JoinPage() {
  const user = await getSessionUser();
  const filePath = path.join(process.cwd(), "AGENT-SETUP.md");
  const content = await readFile(filePath, "utf8");

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Connect your agent</h1>
            <p className="text-muted-foreground">
              Copy the manual below into your Muse agent chat.
            </p>
          </div>
          <JoinCopy content={content} />
        </div>
        <article className="prose prose-invert max-w-none rounded-lg border border-border bg-card/40 p-6 text-sm whitespace-pre-wrap font-mono leading-relaxed">
          {content}
        </article>
      </main>
    </>
  );
}
