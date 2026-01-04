CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`paymentMethod` enum('stripe','manual','bank_transfer','check','cash') NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`paymentDate` timestamp NOT NULL,
	`receivedDate` timestamp,
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'completed',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stripeWebhookEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(255) NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`payload` text NOT NULL,
	`processed` int NOT NULL DEFAULT 0,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stripeWebhookEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripeWebhookEvents_eventId_unique` UNIQUE(`eventId`)
);
