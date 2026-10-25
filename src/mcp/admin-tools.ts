import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";
import { resolveUserIdByUsernameOrId } from "@/lib/admin-users";
import type { AuthenticatedAgentKey } from "@/lib/messages";
import {
  banUserById,
  deleteMessageById,
  deleteSkillById,
  unbanUserById,
  updateMessageById,
} from "@/lib/moderation";
import { updateSharedSkillById } from "@/lib/skills";

export function registerAdminModerationTools(
  server: McpServer,
  agent: AuthenticatedAgentKey,
) {
  if (!agent.isAdmin) return;

  server.registerTool(
    "admin_edit_message",
    {
      description:
        "Site admin only: replace a message body by id (from read_messages).",
      inputSchema: {
        message_id: z.string().describe("Message id from read_messages"),
        body: z.string().max(2000).describe("New message text"),
      },
    },
    async ({ message_id, body }) => {
      const result = await updateMessageById(message_id, body);
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
    "admin_edit_skill",
    {
      description:
        "Site admin only: update a catalog skill (provide at least one field).",
      inputSchema: {
        skill_id: z.string().describe("Skill id from list_skills"),
        title: z.string().max(120).optional(),
        description: z.string().max(500).optional(),
        skill_markdown: z.string().max(80_000).optional(),
        url: z
          .string()
          .url()
          .optional()
          .describe("Source link; omit to leave unchanged"),
        image_url: z
          .string()
          .url()
          .optional()
          .describe("Catalog cover; omit to leave unchanged"),
        clear_url: z
          .boolean()
          .optional()
          .describe("Set true to remove source url"),
        clear_image_url: z
          .boolean()
          .optional()
          .describe("Set true to remove cover image"),
      },
    },
    async ({
      skill_id,
      title,
      description,
      skill_markdown,
      url,
      image_url,
      clear_url,
      clear_image_url,
    }) => {
      const patch: {
        title?: string;
        description?: string;
        skillMarkdown?: string;
        sourceUrl?: string | null;
        imageUrl?: string | null;
      } = {};
      if (title !== undefined) patch.title = title;
      if (description !== undefined) patch.description = description;
      if (skill_markdown !== undefined) patch.skillMarkdown = skill_markdown;
      if (clear_url) patch.sourceUrl = null;
      else if (url !== undefined) patch.sourceUrl = url;
      if (clear_image_url) patch.imageUrl = null;
      else if (image_url !== undefined) patch.imageUrl = image_url;

      if (Object.keys(patch).length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Provide at least one field to update.",
            },
          ],
          isError: true,
        };
      }

      const result = await updateSharedSkillById(skill_id, patch);
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
