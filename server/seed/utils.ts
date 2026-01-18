import Decimal from "decimal.js";

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error("Cannot pick from empty array");
  }
  return arr[randomInt(0, arr.length - 1)]!;
}

export function randomChoices<T>(arr: T[], count: number): T[] {
  if (count > arr.length) {
    throw new Error(
      `Cannot pick ${count} items from array of length ${arr.length}`
    );
  }
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function dateInPast(daysAgo: number): Date {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
}

export function generateDateDistribution(count: number): Date[] {
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  return Array.from({ length: count }, () => {
    const weight = Math.random() ** 2;
    const offset = Math.floor(weight * oneYear);
    return new Date(now - offset);
  }).sort((a, b) => a.getTime() - b.getTime());
}

export function decimalToString(
  value: number | string,
  decimals: number = 8
): string {
  return new Decimal(value).toFixed(decimals);
}

export function generateInvoiceNumber(index: number): string {
  return `INV-${(index + 1).toString().padStart(4, "0")}`;
}

export function generateEstimateNumber(index: number): string {
  return `EST-${(index + 1).toString().padStart(4, "0")}`;
}

export function randomBoolean(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

export function weightedChoice<T>(items: T[], weights: number[]): T {
  if (items.length !== weights.length) {
    throw new Error("Items and weights arrays must have the same length");
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i]!;
    if (random <= 0) {
      return items[i]!;
    }
  }

  return items[items.length - 1]!;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
