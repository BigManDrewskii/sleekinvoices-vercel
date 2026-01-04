CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` text NOT NULL,
	`email` varchar(320),
	`companyName` text,
	`address` text,
	`phone` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`invoiceId` int NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`subject` text NOT NULL,
	`emailType` enum('invoice','reminder','receipt') NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`success` boolean NOT NULL DEFAULT true,
	`errorMessage` text,
	CONSTRAINT `emailLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoiceLineItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`description` text NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`rate` decimal(10,2) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoiceLineItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`status` enum('draft','sent','paid','overdue','canceled') NOT NULL DEFAULT 'draft',
	`subtotal` decimal(10,2) NOT NULL,
	`taxRate` decimal(5,2) NOT NULL DEFAULT '0',
	`taxAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`discountType` enum('percentage','fixed') DEFAULT 'percentage',
	`discountValue` decimal(10,2) NOT NULL DEFAULT '0',
	`discountAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`amountPaid` decimal(10,2) NOT NULL DEFAULT '0',
	`stripePaymentLinkId` varchar(255),
	`stripePaymentLinkUrl` text,
	`stripeSessionId` varchar(255),
	`notes` text,
	`paymentTerms` text,
	`issueDate` timestamp NOT NULL,
	`dueDate` timestamp NOT NULL,
	`sentAt` timestamp,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `companyName` text;--> statement-breakpoint
ALTER TABLE `users` ADD `companyAddress` text;--> statement-breakpoint
ALTER TABLE `users` ADD `companyPhone` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `logoUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('free','active','canceled','past_due') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `currentPeriodEnd` timestamp;