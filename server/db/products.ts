import { eq, and, sql, desc } from "drizzle-orm";
import { products } from "../../drizzle/schema.js";
import { getDb } from "./connection.js";

export async function getProductsByUserId(
  userId: number,
  includeInactive = false
) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select()
    .from(products)
    .where(eq(products.userId, userId))
    .$dynamic();

  if (!includeInactive) {
    query = query.where(eq(products.isActive, true));
  }

  return await query.orderBy(
    desc(products.usageCount),
    desc(products.createdAt)
  );
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.userId, userId)))
    .limit(1);

  return result[0];
}

/**
 * Create a new product
 */
export async function createProduct(product: {
  userId: number;
  name: string;
  description?: string;
  rate: string;
  unit?: string;
  category?: string;
  sku?: string;
  taxable?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(products).values({
    ...product,
    isActive: true,
    usageCount: 0,
  });

  const insertedId = Number(result[0].insertId);
  const inserted = await db
    .select()
    .from(products)
    .where(eq(products.id, insertedId))
    .limit(1);
  return inserted[0]!;
}

/**
 * Update a product
 */
export async function updateProduct(
  id: number,
  userId: number,
  updates: Partial<{
    name: string;
    description: string | null;
    rate: string;
    unit: string | null;
    category: string | null;
    sku: string | null;
    taxable: boolean;
    isActive: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(products)
    .set(updates)
    .where(and(eq(products.id, id), eq(products.userId, userId)));
}

/**
 * Delete a product (soft delete by setting isActive to false)
 */
export async function deleteProduct(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(products)
    .set({ isActive: false })
    .where(and(eq(products.id, id), eq(products.userId, userId)));
}

/**
 * Increment product usage count when added to an invoice
 */
export async function incrementProductUsage(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(products)
    .set({ usageCount: sql`${products.usageCount} + 1` })
    .where(and(eq(products.id, id), eq(products.userId, userId)));
}

/**
 * Search products by name or description
 */
export async function searchProducts(userId: number, query: string) {
  const db = await getDb();
  if (!db) return [];

  const searchTerm = `%${query}%`;

  return await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.userId, userId),
        eq(products.isActive, true),
        sql`(${products.name} LIKE ${searchTerm} OR ${products.description} LIKE ${searchTerm} OR ${products.sku} LIKE ${searchTerm})`
      )
    )
    .orderBy(desc(products.usageCount))
    .limit(10);
}
