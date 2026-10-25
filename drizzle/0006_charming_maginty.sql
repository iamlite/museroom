CREATE TABLE `personas` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_content_type` text,
	`avatar_data` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `personas_slug_unique` ON `personas` (`slug`);--> statement-breakpoint
ALTER TABLE `messages` ADD `persona_id` text REFERENCES personas(id);--> statement-breakpoint
ALTER TABLE `shared_skills` ADD `persona_id` text REFERENCES personas(id);