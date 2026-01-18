import type { MySql2Database } from "drizzle-orm/mysql2";
import {
  emailLog,
  reminderLogs,
  aiUsageLogs,
  auditLog,
  type InsertEmailLog,
} from "../../../drizzle/schema";
import type { SeededInvoice } from "./invoices";
import type { SeededUser } from "./users";
import type { SeededClient } from "./clients";
import {
  EMAIL_DELIVERY_STATUS_DISTRIBUTION,
  SEED_CONFIG,
  AI_OPERATION_TYPES,
  AUDIT_LOG_ACTIONS,
  AUDIT_LOG_ENTITY_TYPES,
  USER_IPS,
  USER_AGENTS,
} from "../data/constants";
import { randomInt, randomChoice, weightedChoice } from "../utils";

export async function seedEmails(
  db: any,
  seededInvoices: SeededInvoice[],
  seededClients: SeededClient[]
): Promise<void> {
  const sentInvoices = seededInvoices.filter(
    inv => inv.status !== "draft" && inv.status !== "canceled"
  );

  for (const invoice of sentInvoices) {
    const client = seededClients.find(c => c.id === invoice.clientId);
    if (!client) continue;

    const now = new Date();
    const sentAt = new Date(
      now.getTime() - randomInt(10, 60) * 24 * 60 * 60 * 1000
    );

    const deliveryStatus = weightedChoice(
      ["sent", "delivered", "opened", "clicked", "bounced", "failed"] as const,
      [
        EMAIL_DELIVERY_STATUS_DISTRIBUTION.sent,
        EMAIL_DELIVERY_STATUS_DISTRIBUTION.delivered,
        EMAIL_DELIVERY_STATUS_DISTRIBUTION.opened,
        EMAIL_DELIVERY_STATUS_DISTRIBUTION.clicked,
        EMAIL_DELIVERY_STATUS_DISTRIBUTION.bounced,
        EMAIL_DELIVERY_STATUS_DISTRIBUTION.failed,
      ]
    );

    const emailData: InsertEmailLog = {
      userId: invoice.userId,
      invoiceId: invoice.id,
      recipientEmail: client.email,
      subject: `Invoice ${invoice.invoiceNumber} from Company`,
      emailType: "invoice",
      sentAt,
      success: deliveryStatus !== "failed",
      errorMessage:
        deliveryStatus === "failed" ? "SMTP connection timeout" : null,
      messageId: `msg_seed_${randomInt(100000, 999999)}`,
      deliveryStatus,
      deliveredAt:
        deliveryStatus !== "sent" && deliveryStatus !== "failed"
          ? new Date(sentAt.getTime() + randomInt(1, 5) * 60 * 1000)
          : null,
      openedAt:
        deliveryStatus === "opened" || deliveryStatus === "clicked"
          ? new Date(sentAt.getTime() + randomInt(1, 24) * 60 * 60 * 1000)
          : null,
      openCount:
        deliveryStatus === "opened" || deliveryStatus === "clicked"
          ? randomInt(1, 5)
          : 0,
      clickedAt:
        deliveryStatus === "clicked"
          ? new Date(sentAt.getTime() + randomInt(1, 48) * 60 * 60 * 1000)
          : null,
      clickCount: deliveryStatus === "clicked" ? randomInt(1, 3) : 0,
      bouncedAt: deliveryStatus === "bounced" ? sentAt : null,
      bounceType:
        deliveryStatus === "bounced"
          ? Math.random() < 0.7
            ? "soft"
            : "hard"
          : null,
    };

    await db.insert(emailLog).values([emailData]);

    if (Math.random() < 0.3 && invoice.status === "overdue") {
      await seedReminderLog(db, invoice, client.email);
    }
  }
}

async function seedReminderLog(
  db: any,
  invoice: SeededInvoice,
  recipientEmail: string
): Promise<void> {
  const now = new Date();
  const daysOverdue = randomChoice([7, 14, 30]);

  await db.insert(reminderLogs).values({
    invoiceId: invoice.id,
    userId: invoice.userId,
    sentAt: new Date(now.getTime() - (30 - daysOverdue) * 24 * 60 * 60 * 1000),
    recipientEmail,
    daysOverdue,
    status: "sent",
  });
}

export async function seedAiLogs(
  db: any,
  seededUsers: SeededUser[]
): Promise<void> {
  for (const user of seededUsers) {
    const numLogs = randomInt(10, SEED_CONFIG.aiLogsPerUser);

    for (let i = 0; i < numLogs; i++) {
      const feature = randomChoice([...AI_OPERATION_TYPES]);
      const now = new Date();

      await db.insert(aiUsageLogs).values({
        userId: user.id,
        feature,
        inputTokens: randomInt(100, 1000),
        outputTokens: randomInt(50, 500),
        model: "claude-3-5-sonnet-20241022",
        latencyMs: randomInt(500, 3000),
        success: Math.random() < 0.95,
        errorMessage: Math.random() < 0.05 ? "Rate limit exceeded" : null,
        createdAt: new Date(
          now.getTime() - randomInt(1, 60) * 24 * 60 * 60 * 1000
        ),
      });
    }
  }
}

export async function seedAuditLogs(
  db: MySql2Database<Record<string, unknown>>,
  seededUsers: SeededUser[]
): Promise<void> {
  for (const user of seededUsers) {
    for (let i = 0; i < SEED_CONFIG.auditLogsPerUser; i++) {
      const action = weightedChoice(
        [...AUDIT_LOG_ACTIONS],
        [0.4, 0.3, 0.05, 0.1, 0.1, 0.05]
      );
      const entityType = randomChoice([...AUDIT_LOG_ENTITY_TYPES]);
      const now = new Date();

      await db.insert(auditLog).values({
        userId: user.id,
        action,
        entityType,
        entityId: randomInt(1, 100),
        ipAddress: randomChoice(USER_IPS),
        userAgent: randomChoice(USER_AGENTS),
        details: JSON.stringify({
          field: "status",
          oldValue: "draft",
          newValue: "sent",
        }),
        createdAt: new Date(
          now.getTime() - randomInt(1, 90) * 24 * 60 * 60 * 1000
        ),
      });
    }
  }
}
