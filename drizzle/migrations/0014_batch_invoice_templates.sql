-- Batch Invoice Templates - saved configurations for creating invoices for multiple clients
CREATE TABLE IF NOT EXISTS `batchInvoiceTemplates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `dueInDays` int NOT NULL DEFAULT 30,
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `taxRate` decimal(5,2) NOT NULL DEFAULT '0',
  `invoiceTemplateId` int,
  `notes` text,
  `paymentTerms` text,
  `frequency` enum('one-time','weekly','monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
  `usageCount` int NOT NULL DEFAULT 0,
  `lastUsedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `batchInvoiceTemplates_id` PRIMARY KEY(`id`)
);

-- Batch Invoice Template Line Items
CREATE TABLE IF NOT EXISTS `batchInvoiceTemplateLineItems` (
  `id` int AUTO_INCREMENT NOT NULL,
  `templateId` int NOT NULL,
  `description` text NOT NULL,
  `quantity` decimal(24,8) NOT NULL,
  `rate` decimal(24,8) NOT NULL,
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `batchInvoiceTemplateLineItems_id` PRIMARY KEY(`id`)
);
