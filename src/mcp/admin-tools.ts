import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";
import { resolveUserIdByUsernameOrId } from "@/lib/admin-users";
import type { AuthenticatedAgentKey } from "@/lib/messages";
import {
  banUserById,
  deleteMessageById,
  deleteSkillById,
  unbanUserById,
} from "@/lib/moderation";

export function registerAdminModerationTools(
  server: McpServer,
  agent: AuthenticatedAgentKey,
) {
  if (!agent.isAdmin) return;

  server.registerTool(
    "admin_delete_message",
    {
      description:
        "Site admin only: permanently delete a chat message by id (from read_messages).",
      inputSchema: {
        message_id: z.string().describe("Message id from read_messages"),
      },
    },
    async ({ message_id }) => {
      const deleted = await deleteMessageById(message_id);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ok: deleted }, null, 2),
          },
        ],
        isError: !deleted,
      };
    },
  );

  server.registerTool(
    "admin_delete_skill",
    {
      description:
        "Site admin only: remove a skill from the public catalog by skill_id.",
      inputSchema: {
        skill_id: z
          .string()
          .describe("Skill id from list_skills or catalog URL"),
      },
    },
    async ({ skill_id }) => {
      const deleted = await deleteSkillById(skill_id);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ok: deleted }, null, 2),
          },
        ],
        isError: !deleted,
      };
    },
  );

  server.registerTool(
    "admin_ban_user",
    {
      description:
        "Site admin only: suspend a human account (blocks login, posting, and all their agent keys).",
      inputSchema: {
        user: z.string().describe("MuseRoom user id or @username (without @)"),
      },
    },
    async ({ user }) => {
      const userId = await resolveUserIdByUsernameOrId(user);
      if (!userId) {
        return {
          content: [{ type: "text", text: "User not found." }],
          isError: true,
        };
      }
      const result = await banUserById(userId);
      if (!result.ok) {
        return {
          content: [{ type: "text", text: result.reason }],
          isError: true,
        };
      }
      return {
        content: [
          { type: "text", text: JSON.stringify({ ok: true }, null, 2) },
        ],
      };
    },
  );

  server.registerTool(
    "admin_unban_user",
    {
      description: "Site admin only: restore a suspended human account.",
      inputSchema: {
        user: z.string().describe("MuseRoom user id or username"),
      },
    },
    async ({ user }) => {
      const userId = await resolveUserIdByUsernameOrId(user);
      if (!userId) {
        return {
          content: [{ type: "text", text: "User not found." }],
          isError: true,
        };
      }
      const ok = await unbanUserById(userId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ok }, null, 2),
          },
        ],
        isError: !ok,
      };
    },
  );
}
