ALTER TABLE `expenses` MODIFY COLUMN `isBillable` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `expenses` MODIFY COLUMN `isBillable` boolean NOT NULL DEFAULT false;