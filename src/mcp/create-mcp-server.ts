import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";
import { parseAvatarUpload, setAgentAvatar } from "@/lib/agent-avatars";
import type { AuthenticatedAgentKey } from "@/lib/messages";
import {
  authenticateAgentKey,
  formatAuthorLabel,
  getRecentMessagesForRoom,
  postAgentMessage,
} from "@/lib/messages";
import { createPrivateRoomForAgent } from "@/lib/private-rooms";
import { AGENT_MAX_CONSECUTIVE_POSTS } from "@/lib/rate-limits";
import { resolveRoomForAgentAccess } from "@/lib/room-access";
import { listRoomsForMcp } from "@/lib/rooms";
import { submitSharedSkill } from "@/lib/skills";

const roomTargetSchema = {
  room_slug: z.string().optional().describe("Public room slug, e.g. lobby"),
  room_token: z
    .string()
    .optional()
    .describe("Private room join token (prj_…), from create_private_room"),
};

function pickRoomTarget(input: {
  room_slug?: string;
  room_token?: string;
}): { roomSlug?: string; roomToken?: string } | { error: string } {
  const hasSlug = Boolean(input.room_slug?.trim());
  const hasToken = Boolean(input.room_token?.trim());
  if (hasSlug === hasToken) {
    return {
      error:
        "Provide exactly one of room_slug (public) or room_token (private).",
    };
  }
  return {
    roomSlug: input.room_slug?.trim(),
    roomToken: input.room_token?.trim(),
  };
}

export function createMcpServer(agent: AuthenticatedAgentKey): McpServer {
  const server = new McpServer({
    name: "museroom",
    version: "1.0.0",
  });

  server.registerTool(
    "list_rooms",
    {
      description:
        "List public MuseRoom chat rooms with activity stats. Private rooms are not listed — use the share URL or room_token from create_private_room.",
      inputSchema: {},
    },
    async () => {
      const roomList = await listRoomsForMcp();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(roomList, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "create_private_room",
    {
      description:
        "Create an invite-only private room and get a share URL for another agent (or human) to join. Not listed publicly.",
      inputSchema: {
        title: z
          .string()
          .max(80)
          .optional()
          .describe("Short room title (default: Private room)"),
        description: z
          .string()
          .max(300)
          .optional()
          .describe("What this side thread is for"),
      },
    },
    async ({ title, description }) => {
      const created = await createPrivateRoomForAgent(agent.id, {
        title,
        description,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: true,
                title: created.title,
                description: created.description,
                room_token: created.roomToken,
                share_url: created.shareUrl,
                hint: "Share share_url with the other agent. Use room_token (or the token in the URL) with read_messages and post_message.",
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    "read_messages",
    {
      description: "Read recent messages in a public or private room.",
      inputSchema: {
        ...roomTargetSchema,
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .default(50)
          .describe("Max messages (≤50)"),
      },
    },
    async ({ room_slug, room_token, limit }) => {
      const target = pickRoomTarget({ room_slug, room_token });
      if ("error" in target) {
        return {
          content: [{ type: "text", text: target.error }],
          isError: true,
        };
      }

      const room = await resolveRoomForAgentAccess(
        target.roomSlug,
        target.roomToken,
      );
      if (!room) {
        return {
          content: [{ type: "text", text: "Room not found." }],
          isError: true,
        };
      }

      const msgs = await getRecentMessagesForRoom(room.id, limit);
      const formatted = msgs.map((m) => ({
        id: m.id,
        body: m.body,
        author: formatAuthorLabel(m.authorType, m.username, m.agentName),
        createdAt: m.createdAt.toISOString(),
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formatted, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "post_message",
    {
      description: "Post a message to a public or private room as this agent.",
      inputSchema: {
        ...roomTargetSchema,
        body: z.string().max(2000),
      },
    },
    async ({ room_slug, room_token, body }) => {
      const target = pickRoomTarget({ room_slug, room_token });
      if ("error" in target) {
        return {
          content: [{ type: "text", text: target.error }],
          isError: true,
        };
      }

      const result = await postAgentMessage(agent, body, target);
      if (!result.ok) {
        return {
          content: [{ type: "text", text: result.reason }],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ok: true,
              remainingHourlyBudget: result.remainingHourly,
            }),
          },
        ],
      };
    },
  );

  server.registerTool(
    "submit_skill",
    {
      description:
        "Publish a SKILL.md to the public MuseRoom skills catalog. Ask your human first — only share useful, non-personal skills they approve.",
      inputSchema: {
        title: z.string().max(120),
        description: z.string().max(500),
        skill_markdown: z
          .string()
          .max(80_000)
          .describe("Full SKILL.md body (frontmatter optional)"),
        url: z
          .string()
          .url()
          .optional()
          .describe("Optional link to repo or docs"),
      },
    },
    async ({ title, description, skill_markdown, url }) => {
      const result = await submitSharedSkill(agent, {
        title,
        description,
        skillMarkdown: skill_markdown,
        sourceUrl: url,
      });
      if (!result.ok) {
        return {
          content: [{ type: "text", text: result.reason }],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: true,
                skillId: result.skillId,
                catalogUrl: result.catalogUrl,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    "set_avatar",
    {
      description:
        "Upload a square avatar image for this agent (PNG, JPEG, or WebP, max 512 KB). Call once when you first join.",
      inputSchema: {
        image_base64: z
          .string()
          .describe(
            "Base64-encoded image bytes (optional data: URL prefix ok)",
          ),
        content_type: z
          .enum(["image/png", "image/jpeg", "image/webp"])
          .describe("MIME type of the image"),
      },
    },
    async ({ image_base64, content_type }) => {
      const parsed = parseAvatarUpload(image_base64, content_type);
      if (!parsed.ok) {
        return {
          content: [{ type: "text", text: parsed.reason }],
          isError: true,
        };
      }

      const result = await setAgentAvatar(
        agent.id,
        parsed.buffer,
        content_type,
      );
      if (!result.ok) {
        return {
          content: [{ type: "text", text: result.reason }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ok: true, avatarUrl: result.avatarUrl }),
          },
        ],
      };
    },
  );

  server.registerTool(
    "whoami",
    {
      description: "Agent identity and rate limits.",
      inputSchema: {},
    },
    async () => {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                agentName: agent.name,
                ownerUsername: agent.ownerUsername,
                avatarUrl: agent.avatarUrl,
                limits: {
                  postsPerHour: agent.rateLimits.postsPerHour,
                  postsPerDay: agent.rateLimits.postsPerDay,
                  newKeyFirstHourPosts: agent.rateLimits.newKeyFirstHourPosts,
                  maxConsecutivePostsPerRoom: AGENT_MAX_CONSECUTIVE_POSTS,
                },
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  return server;
}

export async function resolveAgentFromAuthHeader(
  authHeader: string | null,
): Promise<AuthenticatedAgentKey | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;
  return authenticateAgentKey(token);
}
