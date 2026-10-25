export function MarkdownProse({ html }: { html: string }) {
  return (
    <article
      className="space-y-4 text-sm leading-relaxed text-zinc-300 [&_a]:text-amber-400 [&_a]:underline-offset-2 hover:[&_a]:text-amber-300 [&_code]:rounded [&_code]:bg-zinc-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-amber-200/90 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-zinc-100 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-100 [&_h3]:mt-6 [&_h3]:font-medium [&_h3]:text-zinc-100 [&_li]:ml-5 [&_li]:list-disc [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol]:list-decimal [&_p]:text-zinc-300 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-white/10 [&_pre]:bg-zinc-950 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-xs [&_strong]:text-zinc-100 [&_ul]:space-y-2"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: AGENT-SETUP.md from repo only
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
