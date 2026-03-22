CREATE TABLE `ai_signals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`symbol` text NOT NULL,
	`model_source` text NOT NULL,
	`model_name` text NOT NULL,
	`signal` text NOT NULL,
	`confidence` real NOT NULL,
	`reasoning` text NOT NULL,
	`prompt_hash` text NOT NULL,
	`indicators_snapshot` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`acted_on` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portfolio_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text NOT NULL,
	`total_value` real NOT NULL,
	`cash` real NOT NULL,
	`invested` real NOT NULL,
	`unrealized_pnl` real NOT NULL,
	`realized_pnl` real NOT NULL
);
--> statement-breakpoint
CREATE INDEX `portfolio_snapshots_timestamp_idx` ON `portfolio_snapshots` (`timestamp`);--> statement-breakpoint
CREATE TABLE `positions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`symbol` text NOT NULL,
	`quantity` real NOT NULL,
	`avg_entry_price` real NOT NULL,
	`current_price` real NOT NULL,
	`unrealized_pnl` real NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `positions_symbol_idx` ON `positions` (`symbol`);--> statement-breakpoint
CREATE TABLE `trades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`symbol` text NOT NULL,
	`side` text NOT NULL,
	`quantity` real NOT NULL,
	`price` real NOT NULL,
	`executed_at` text NOT NULL,
	`signal_id` integer,
	`signal_source` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`signal_id`) REFERENCES `ai_signals`(`id`) ON UPDATE no action ON DELETE no action
);
