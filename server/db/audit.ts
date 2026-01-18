import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { auditLog } from "../../drizzle/schema.js";
import { getDb } from "./connection.js";

export async function logAuditEvent(data: {
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  entityName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(auditLog).values({
    userId: data.userId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId || null,
    entityName: data.entityName || null,
    details: data.details ? JSON.stringify(data.details) : null,
    ipAddress: data.ipAddress || null,
    userAgent: data.userAgent || null,
  });
}

/**
 * Get audit logs for a user with pagination
 */
export async function getAuditLogs(
  userId: number,
  options: {
    limit?: number;
    offset?: number;
    entityType?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };

  const {
    limit = 50,
    offset = 0,
    entityType,
    action,
    startDate,
    endDate,
  } = options;

  // Build conditions
  const conditions = [eq(auditLog.userId, userId)];

  if (entityType) {
    conditions.push(eq(auditLog.entityType, entityType));
  }
  if (action) {
    conditions.push(eq(auditLog.action, action));
  }
  if (startDate) {
    conditions.push(gte(auditLog.createdAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(auditLog.createdAt, endDate));
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(auditLog)
    .where(and(...conditions));

  const total = countResult[0]?.count || 0;

  // Get logs
  const logs = await db
    .select()
    .from(auditLog)
    .where(and(...conditions))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)
    .offset(offset);

  // Parse details JSON
  const parsedLogs = logs.map(log => ({
    ...log,
    details: log.details ? JSON.parse(log.details as string) : null,
  }));

  return { logs: parsedLogs, total };
}

/**
 * Get recent activity for a specific entity
 */
export async function getEntityAuditLogs(
  userId: number,
  entityType: string,
  entityId: number,
  limit: number = 20
) {
  const db = await getDb();
  if (!db) return [];

  const logs = await db
    .select()
    .from(auditLog)
    .where(
      and(
        eq(auditLog.userId, userId),
        eq(auditLog.entityType, entityType),
        eq(auditLog.entityId, entityId)
      )
    )
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);

  return logs.map(log => ({
    ...log,
    details: log.details ? JSON.parse(log.details as string) : null,
  }));
}
