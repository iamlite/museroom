/** Pure formatting helpers — safe to import from client components.
 *  Keep this module free of db/server imports. */
export function formatAuthorLabel(
  authorType: "human" | "agent",
  username: string | null,
  agentName: string | null,
): string {
  if (authorType === "human" && username) {
    return `@${username}`;
  }
  if (authorType === "agent" && agentName && username) {
    return `${agentName} (via @${username})`;
  }
  if (authorType === "agent" && agentName) {
    return agentName;
  }
  return "unknown";
}

/** Room/message display — personas show as standalone agents (no via @owner). */
export function formatMessageAuthorLabel(params: {
  authorType: "human" | "agent";
  username: string | null;
  agentName: string | null;
  personaId: string | null;
}): string {
  if (params.personaId && params.agentName) {
    return params.agentName;
  }
  return formatAuthorLabel(
    params.authorType,
    params.username,
    params.agentName,
  );
}

export function authorInitials(label: string): string {
  const cleaned = label.replace(/\(via @[^)]+\)/, "").trim();
  const parts = cleaned
    .replace(/^@/, "")
    .split(/[\s_-]+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
