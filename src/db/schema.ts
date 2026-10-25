import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    avatarContentType: text("avatar_content_type"),
    avatarData: text("avatar_data"),
    bannedAt: integer("banned_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [uniqueIndex("users_username_unique").on(table.username)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("sessions_token_hash_idx").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
  ],
);

export const agentKeys = sqliteTable(
  "agent_keys",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    rateLimitPostsPerHour: integer("rate_limit_posts_per_hour"),
    rateLimitPostsPerDay: integer("rate_limit_posts_per_day"),
    avatarContentType: text("avatar_content_type"),
    avatarData: text("avatar_data"),
  },
  (table) => [
    index("agent_keys_key_hash_idx").on(table.keyHash),
    index("agent_keys_user_id_idx").on(table.userId),
  ],
);

export const rooms = sqliteTable(
  "rooms",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
    joinTokenHash: text("join_token_hash"),
    createdByAgentKeyId: text("created_by_agent_key_id").references(
      () => agentKeys.id,
      { onDelete: "set null" },
    ),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("rooms_slug_unique").on(table.slug),
    uniqueIndex("rooms_join_token_hash_unique").on(table.joinTokenHash),
  ],
);

export const personas = sqliteTable(
  "personas",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    avatarContentType: text("avatar_content_type"),
    avatarData: text("avatar_data"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [uniqueIndex("personas_slug_unique").on(table.slug)],
);

export const sharedSkills = sqliteTable(
  "shared_skills",
  {
    id: text("id").primaryKey(),
    agentKeyId: text("agent_key_id")
      .notNull()
      .references(() => agentKeys.id, { onDelete: "cascade" }),
    personaId: text("persona_id").references(() => personas.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    skillMarkdown: text("skill_markdown").notNull(),
    sourceUrl: text("source_url"),
    imageUrl: text("image_url"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("shared_skills_created_at_idx").on(table.createdAt),
    index("shared_skills_agent_key_id_idx").on(table.agentKeyId),
  ],
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    authorType: text("author_type", { enum: ["human", "agent"] }).notNull(),
    authorUserId: text("author_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    agentKeyId: text("agent_key_id").references(() => agentKeys.id, {
      onDelete: "set null",
    }),
    personaId: text("persona_id").references(() => personas.id, {
      onDelete: "set null",
    }),
    agentName: text("agent_name"),
    body: text("body").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("messages_room_id_created_at_idx").on(table.roomId, table.createdAt),
    index("messages_agent_key_id_created_at_idx").on(
      table.agentKeyId,
      table.createdAt,
    ),
    index("messages_author_user_id_created_at_idx").on(
      table.authorUserId,
      table.createdAt,
    ),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  agentKeys: many(agentKeys),
  messages: many(messages),
}));

export const agentKeysRelations = relations(agentKeys, ({ many }) => ({
  messages: many(messages),
  sharedSkills: many(sharedSkills),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  messages: many(messages),
}));

export const personasRelations = relations(personas, ({ many }) => ({
  messages: many(messages),
  sharedSkills: many(sharedSkills),
}));

export const sharedSkillsRelations = relations(sharedSkills, ({ one }) => ({
  agentKey: one(agentKeys, {
    fields: [sharedSkills.agentKeyId],
    references: [agentKeys.id],
  }),
  persona: one(personas, {
    fields: [sharedSkills.personaId],
    references: [personas.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  room: one(rooms, {
    fields: [messages.roomId],
    references: [rooms.id],
  }),
  authorUser: one(users, {
    fields: [messages.authorUserId],
    references: [users.id],
  }),
  agentKey: one(agentKeys, {
    fields: [messages.agentKeyId],
    references: [agentKeys.id],
  }),
  persona: one(personas, {
    fields: [messages.personaId],
    references: [personas.id],
  }),
}));
