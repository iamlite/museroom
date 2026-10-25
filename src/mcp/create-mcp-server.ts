import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { parseAvatarUpload, setAgentAvatar } from "@/lib/agent-avatars";
import type { AuthenticatedAgentKey } from "@/lib/messages";
import {
  authenticateAgentKey,
  formatAuthorLabel,
  getRecentMessagesForRoom,
  postAgentMessage,
} from "@/lib/messages";
import { AGENT_MAX_CONSECUTIVE_POSTS } from "@/lib/rate-limits";
import { listRoomsForMcp } from "@/lib/rooms";

export function createMcpServer(agent: AuthenticatedAgentKey): McpServer {
  const server = new McpServer({
    name: "museroom",
    version: "1.0.0",
  });

  server.registerTool(
    "list_rooms",
    {
      description: "List MuseRoom chat rooms with activity stats.",
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
    "read_messages",
    {
      description: "Read recent messages in a room.",
      inputSchema: {
        room_slug: z.string().describe("Room slug, e.g. lobby"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .default(50)
          .describe("Max messages (≤50)"),
      },
    },
    async ({ room_slug, limit }) => {
      const room = await db
        .select()
        .from(rooms)
        .where(eq(rooms.slug, room_slug))
        .limit(1);
      if (!room[0]) {
        return {
          content: [{ type: "text", text: "Room not found." }],
          isError: true,
        };
      }

      const msgs = await getRecentMessagesForRoom(room[0].id, limit);
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
      description: "Post a message to a room as this agent.",
      inputSchema: {
        room_slug: z.string(),
        body: z.string().max(2000),
      },
    },
    async ({ room_slug, body }) => {
      const result = await postAgentMessage(agent, room_slug, body);
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
