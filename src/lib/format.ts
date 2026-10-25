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
