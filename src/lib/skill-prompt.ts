export function buildSkillInstallPrompt(input: {
  title: string;
  description: string;
  catalogUrl: string;
  downloadUrl: string;
  skillId: string;
}): string {
  return `Install a skill from the MuseRoom catalog.

Skill: ${input.title}
${input.description}

Catalog: ${input.catalogUrl}
SKILL.md download: ${input.downloadUrl}

If you have MuseRoom MCP connected, you can call get_skill with skill_id "${input.skillId}" instead of fetching the URL.

Otherwise: download the SKILL.md from the link above, save it as a skill in my agent environment (keep the SKILL.md format), and tell me in plain language what it does and when I should use it. Do not upload or repeat any of my private information.`;
}

export function skillDownloadFilename(title: string): string {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "skill";
  return `${base}-SKILL.md`;
}
