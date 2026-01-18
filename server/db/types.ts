// Type exports from database operations
export type ExpenseWithDetails = Awaited<
  ReturnType<typeof getExpensesByUserId>
>[number];

export type EstimateWithClient = Awaited<
  ReturnType<typeof getEstimatesByUserId>
>[number];

// Import required functions for type extraction
import { getExpensesByUserId } from "./expenses.js";
import { getEstimatesByUserId } from "./estimates.js";
