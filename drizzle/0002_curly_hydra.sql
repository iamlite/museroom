CREATE TABLE `shared_skills` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_key_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`skill_markdown` text NOT NULL,
	`source_url` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`agent_key_id`) REFERENCES `agent_keys`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `shared_skills_created_at_idx` ON `shared_skills` (`created_at`);--> statement-breakpoint
CREATE INDEX `shared_skills_agent_key_id_idx` ON `shared_skills` (`agent_key_id`);--> statement-breakpoint
ALTER TABLE `rooms` ADD `is_public` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `rooms` ADD `join_token_hash` text;--> statement-breakpoint
ALTER TABLE `rooms` ADD `created_by_agent_key_id` text REFERENCES agent_keys(id);--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_join_token_hash_unique` ON `rooms` (`join_token_hash`);