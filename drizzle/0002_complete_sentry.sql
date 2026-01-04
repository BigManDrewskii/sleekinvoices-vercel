CREATE TABLE `expenseCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(7) NOT NULL DEFAULT '#64748b',
	`icon` varchar(50) NOT NULL DEFAULT 'receipt',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenseCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`date` timestamp NOT NULL,
	`vendor` varchar(255),
	`description` text NOT NULL,
	`notes` text,
	`receiptUrl` text,
	`paymentMethod` varchar(50),
	`isRecurring` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoiceTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`primaryColor` varchar(7) NOT NULL DEFAULT '#3b82f6',
	`secondaryColor` varchar(7) NOT NULL DEFAULT '#64748b',
	`accentColor` varchar(7) NOT NULL DEFAULT '#10b981',
	`fontFamily` varchar(50) NOT NULL DEFAULT 'Inter',
	`fontSize` int NOT NULL DEFAULT 14,
	`logoPosition` enum('left','center','right') NOT NULL DEFAULT 'left',
	`showCompanyAddress` boolean NOT NULL DEFAULT true,
	`showPaymentTerms` boolean NOT NULL DEFAULT true,
	`footerText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoiceTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recurringInvoiceLineItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recurringInvoiceId` int NOT NULL,
	`description` text NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`rate` decimal(10,2) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recurringInvoiceLineItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recurringInvoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int NOT NULL,
	`frequency` enum('weekly','monthly','yearly') NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`nextInvoiceDate` timestamp NOT NULL,
	`invoiceNumberPrefix` varchar(50) NOT NULL,
	`taxRate` decimal(5,2) NOT NULL DEFAULT '0',
	`discountType` enum('percentage','fixed') DEFAULT 'percentage',
	`discountValue` decimal(10,2) NOT NULL DEFAULT '0',
	`notes` text,
	`paymentTerms` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastGeneratedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recurringInvoices_id` PRIMARY KEY(`id`)
);
