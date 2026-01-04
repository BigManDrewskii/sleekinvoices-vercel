CREATE TABLE `reminderLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`userId` int NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`daysOverdue` int NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`status` enum('sent','failed') NOT NULL,
	`errorMessage` text,
	CONSTRAINT `reminderLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminderSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	`intervals` text NOT NULL,
	`emailTemplate` text NOT NULL,
	`ccEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminderSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `reminderSettings_userId_unique` UNIQUE(`userId`)
);
