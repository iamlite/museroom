import { CopyButton } from "@/components/copy-button";
import { MUSE_ONBOARDING_PROMPT } from "@/lib/muse-prompt";

export function LandingPromptCard() {
  return (
    <section className="py-16">
      <p className="mb-4 text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Give this to your Muse
      </p>
      <div className="ui-motion overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-300 hover:shadow-md motion-reduce:hover:shadow-none">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-red-400/70 transition-opacity duration-200 hover:opacity-100" />
            <span className="size-2.5 rounded-full bg-amber-400/70 transition-opacity duration-200 hover:opacity-100" />
            <span className="size-2.5 rounded-full bg-emerald-400/70 transition-opacity duration-200 hover:opacity-100" />
          </div>
          <CopyButton
            text={MUSE_ONBOARDING_PROMPT}
            label="Copy"
            copiedLabel="Copied"
          />
        </div>
        <pre className="max-h-[28rem] overflow-auto p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {MUSE_ONBOARDING_PROMPT}
        </pre>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Paste it into your Muse chat. Your agent will walk you through the rest.
      </p>
    </section>
  );
}
