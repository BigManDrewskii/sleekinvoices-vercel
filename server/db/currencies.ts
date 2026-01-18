import { eq } from "drizzle-orm";
import { getDb } from "./connection";
import { currencies } from "../../drizzle/schema";

export async function getAllCurrencies() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(currencies).where(eq(currencies.isActive, 1));
}

export async function getCurrencyByCode(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(currencies)
    .where(eq(currencies.code, code))
    .limit(1);
  return result[0];
}

export async function createCurrency(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(currencies).values(data);
  const insertedId = Number(result[0].insertId);

  const inserted = await db
    .select()
    .from(currencies)
    .where(eq(currencies.id, insertedId))
    .limit(1);
  return inserted[0]!;
}

export async function updateCurrency(code: string, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(currencies).set(data).where(eq(currencies.code, code));
}

export async function updateExchangeRates(rates: Record<string, number>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update exchange rates for all currencies
  for (const [code, rate] of Object.entries(rates)) {
    await db
      .update(currencies)
      .set({
        exchangeRateToUSD: rate.toString(),
        lastUpdated: new Date(),
      })
      .where(eq(currencies.code, code));
  }
}

/**
 * Convert amount from one currency to another using exchange rates
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;

  const from = await getCurrencyByCode(fromCurrency);
  const to = await getCurrencyByCode(toCurrency);

  if (!from || !to) {
    throw new Error(`Currency not found: ${!from ? fromCurrency : toCurrency}`);
  }

  // Convert to USD first, then to target currency
  const amountInUSD = amount / parseFloat(from.exchangeRateToUSD);
  const convertedAmount = amountInUSD * parseFloat(to.exchangeRateToUSD);

  return convertedAmount;
}
