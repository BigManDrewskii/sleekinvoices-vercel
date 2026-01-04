CREATE TABLE `clientPortalAccess` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`accessToken` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`lastAccessedAt` timestamp,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clientPortalAccess_id` PRIMARY KEY(`id`),
	CONSTRAINT `clientPortalAccess_accessToken_unique` UNIQUE(`accessToken`)
);
--> statement-breakpoint
CREATE TABLE `currencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(3) NOT NULL,
	`name` varchar(100) NOT NULL,
	`symbol` varchar(10) NOT NULL,
	`exchangeRateToUSD` varchar(20) NOT NULL,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`isActive` int NOT NULL DEFAULT 1,
	CONSTRAINT `currencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `currencies_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `invoiceGenerationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recurringInvoiceId` int NOT NULL,
	`generatedInvoiceId` int,
	`generationDate` timestamp NOT NULL DEFAULT (now()),
	`status` enum('success','failed') NOT NULL,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoiceGenerationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `invoices` ADD `currency` varchar(3) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `baseCurrency` varchar(3) DEFAULT 'USD' NOT NULL;