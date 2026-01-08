-- QuickBooks Payment Mapping table
CREATE TABLE IF NOT EXISTS `quickbooksPaymentMapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`paymentId` int NOT NULL,
	`qbPaymentId` varchar(50) NOT NULL,
	`qbInvoiceId` varchar(50),
	`syncDirection` enum('to_qb','from_qb') NOT NULL,
	`syncVersion` int NOT NULL DEFAULT 1,
	`lastSyncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quickbooksPaymentMapping_id` PRIMARY KEY(`id`),
	CONSTRAINT `qb_payment_idx` UNIQUE(`userId`,`paymentId`),
	CONSTRAINT `qb_payment_qb_idx` UNIQUE(`userId`,`qbPaymentId`)
);

-- QuickBooks Sync Settings table
CREATE TABLE IF NOT EXISTS `quickbooksSyncSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`autoSyncInvoices` boolean NOT NULL DEFAULT true,
	`autoSyncPayments` boolean NOT NULL DEFAULT true,
	`syncPaymentsFromQB` boolean NOT NULL DEFAULT true,
	`minInvoiceAmount` decimal(24,8),
	`syncDraftInvoices` boolean NOT NULL DEFAULT false,
	`lastPaymentPollAt` timestamp,
	`pollIntervalMinutes` int NOT NULL DEFAULT 60,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quickbooksSyncSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `quickbooksSyncSettings_userId_unique` UNIQUE(`userId`)
);
