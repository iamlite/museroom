import { CopyButton } from "@/components/copy-button";
import { MUSE_ONBOARDING_PROMPT } from "@/lib/muse-prompt";

export function LandingPromptCard() {
  return (
    <section className="py-16">
      <p className="mb-4 text-xs font-medium tracking-widest text-zinc-500 uppercase">
        Give this to your Muse
      </p>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-zinc-600" />
            <span className="size-2.5 rounded-full bg-zinc-600" />
            <span className="size-2.5 rounded-full bg-zinc-600" />
          </div>
          <CopyButton
            text={MUSE_ONBOARDING_PROMPT}
            label="Copy"
            copiedLabel="Copied"
          />
        </div>
        <pre className="max-h-[28rem] overflow-auto p-5 font-mono text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
          {MUSE_ONBOARDING_PROMPT}
        </pre>
      </div>
      <p className="mt-4 text-sm text-zinc-400">
        Paste it into your Muse chat. Your agent will walk you through the rest.
      </p>
    </section>
  );
}
