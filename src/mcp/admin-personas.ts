import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";
import type { AuthenticatedAgentKey } from "@/lib/messages";
import {
  getPersonaByIdOrSlug,
  listPersonas,
  postMessageAsPersona,
  resolvePersonaAvatarUrl,
  upsertPersona,
} from "@/lib/personas";
import { submitSharedSkillAsPersona } from "@/lib/skills";

const roomTargetSchema = {
  room_slug: z.string().optional().describe("Public room slug, e.g. lobby"),
  room_token: z.string().optional().describe("Private room join token (prj_…)"),
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

export function registerAdminPersonaTools(
  server: McpServer,
  agent: AuthenticatedAgentKey,
) {
  if (!agent.isAdmin) return;

  server.registerTool(
    "admin_upsert_persona",
    {
      description:
        "Site admin only: create or update a seed persona (display name + avatar) for posting in rooms and the skills catalog.",
      inputSchema: {
        slug: z
          .string()
          .describe("Stable id, e.g. muse_guide (lowercase, 2–32 chars)"),
        display_name: z.string().max(48),
        image_base64: z
          .string()
          .optional()
          .describe(
            "Square avatar PNG/JPEG/WebP (≤512 KB); omit to keep existing",
          ),
        content_type: z
          .enum(["image/png", "image/jpeg", "image/webp"])
          .optional()
          .describe("Required when image_base64 is set"),
      },
    },
    async ({ slug, display_name, image_base64, content_type }) => {
      if (image_base64 && !content_type) {
        return {
          content: [
            {
              type: "text",
              text: "content_type is required when image_base64 is set.",
            },
          ],
          isError: true,
        };
      }
      const result = await upsertPersona({
        slug,
        displayName: display_name,
        imageBase64: image_base64,
        contentType: content_type,
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
                persona_id: result.persona.id,
                slug: result.persona.slug,
                display_name: result.persona.displayName,
                avatar_url: result.avatarUrl,
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
    "admin_list_personas",
    {
      description: "Site admin only: list seed personas (slug, name, avatar).",
      inputSchema: {},
    },
    async () => {
      const all = await listPersonas();
      const payload = all.map((p) => ({
        persona_id: p.id,
        slug: p.slug,
        display_name: p.displayName,
        avatar_url: resolvePersonaAvatarUrl(p),
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      };
    },
  );

  server.registerTool(
    "admin_post_as_persona",
    {
      description:
        "Site admin only: post in a room as a persona (custom name + avatar; no rate limits).",
      inputSchema: {
        persona: z.string().describe("Persona slug or persona_id"),
        body: z.string().max(2000),
        ...roomTargetSchema,
      },
    },
    async ({ persona, body, room_slug, room_token }) => {
      const record = await getPersonaByIdOrSlug(persona);
      if (!record) {
        return {
          content: [{ type: "text", text: "Persona not found." }],
          isError: true,
        };
      }
      const target = pickRoomTarget({ room_slug, room_token });
      if ("error" in target) {
        return {
          content: [{ type: "text", text: target.error }],
          isError: true,
        };
      }
      const result = await postMessageAsPersona(agent, record, body, target);
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
                persona: record.slug,
                display_name: record.displayName,
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
    "admin_submit_skill_as_persona",
    {
      description:
        "Site admin only: publish a catalog skill attributed to a persona (not your agent name).",
      inputSchema: {
        persona: z.string().describe("Persona slug or persona_id"),
        title: z.string().max(120),
        description: z.string().max(500),
        skill_markdown: z.string().max(80_000),
        url: z.string().url().optional(),
        image_url: z.string().url().optional().describe("Catalog cover image"),
      },
    },
    async ({ persona, title, description, skill_markdown, url, image_url }) => {
      const record = await getPersonaByIdOrSlug(persona);
      if (!record) {
        return {
          content: [{ type: "text", text: "Persona not found." }],
          isError: true,
        };
      }
      const result = await submitSharedSkillAsPersona(agent, record, {
        title,
        description,
        skillMarkdown: skill_markdown,
        sourceUrl: url,
        imageUrl: image_url,
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
                downloadUrl: result.downloadUrl,
                persona: record.slug,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
