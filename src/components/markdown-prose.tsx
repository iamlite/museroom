export function MarkdownProse({ html }: { html: string }) {
  return (
    <article
      className="space-y-4 text-sm leading-relaxed text-muted-foreground [&_a]:text-amber-600 [&_a]:underline-offset-2 hover:[&_a]:text-amber-500 dark:[&_a]:text-amber-400 dark:hover:[&_a]:text-amber-300 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-amber-800 dark:[&_code]:text-amber-200/90 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:font-medium [&_h3]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol]:list-decimal [&_p]:text-muted-foreground [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-xs [&_strong]:text-foreground [&_ul]:space-y-2"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: AGENT-SETUP.md from repo only
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
