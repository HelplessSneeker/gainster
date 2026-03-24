CREATE TABLE `account` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cash` real NOT NULL,
	`realized_pnl` real DEFAULT 0 NOT NULL,
	`initial_cash` real NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
