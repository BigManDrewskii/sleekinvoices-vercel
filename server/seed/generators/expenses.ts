import type { MySql2Database } from "drizzle-orm/mysql2";
import { expenses, type InsertExpense } from "../../../drizzle/schema";
import type { SeededUser } from "./users";
import type { SeededClient } from "./clients";
import type { SeededInvoice } from "./invoices";
import type { SeededExpenseCategory } from "./metadata";
import {
  SEED_CONFIG,
  EXPENSE_PAYMENT_METHOD_DISTRIBUTION,
} from "../data/constants";
import { EXPENSE_VENDORS } from "../data/realistic-data";
import {
  randomInt,
  randomChoice,
  weightedChoice,
  generateDateDistribution,
} from "../utils";

export async function seedExpenses(
  db: MySql2Database<Record<string, unknown>>,
  seededUsers: SeededUser[],
  seededClients: SeededClient[],
  seededInvoices: SeededInvoice[],
  seededCategories: SeededExpenseCategory[]
): Promise<void> {
  for (const user of seededUsers) {
    const userCategories = seededCategories.filter(c => c.userId === user.id);
    const userClients = seededClients.filter(c => c.userId === user.id);
    const userInvoices = seededInvoices.filter(i => i.userId === user.id);

    const dates = generateDateDistribution(SEED_CONFIG.expensesPerUser);

    for (let i = 0; i < SEED_CONFIG.expensesPerUser; i++) {
      const category = randomChoice(userCategories);
      const amount = randomInt(50, 2000);
      const isBillable = Math.random() < 0.4;
      const isTaxDeductible = Math.random() < 0.6;
      const hasReceipt = Math.random() < 0.6;

      const paymentMethod = weightedChoice(
        ["cash", "credit_card", "bank_transfer", "check", "other"] as const,
        [
          EXPENSE_PAYMENT_METHOD_DISTRIBUTION.cash,
          EXPENSE_PAYMENT_METHOD_DISTRIBUTION.credit_card,
          EXPENSE_PAYMENT_METHOD_DISTRIBUTION.bank_transfer,
          EXPENSE_PAYMENT_METHOD_DISTRIBUTION.check,
          EXPENSE_PAYMENT_METHOD_DISTRIBUTION.other,
        ]
      );

      const expenseData: InsertExpense = {
        userId: user.id,
        categoryId: category.id,
        vendor: randomChoice(EXPENSE_VENDORS),
        description: getExpenseDescription(category.name),
        amount: String(amount),
        currency: "USD",
        date: dates[i]!,
        paymentMethod,
        isBillable,
        isTaxDeductible,
        receiptUrl: hasReceipt
          ? `s3://receipts/seed-receipt-${randomInt(1000, 9999)}.pdf`
          : null,
        clientId:
          isBillable && userClients.length > 0
            ? randomChoice(userClients).id
            : null,
        invoiceId:
          isBillable && Math.random() < 0.5 && userInvoices.length > 0
            ? randomChoice(userInvoices).id
            : null,
      };

      await db.insert(expenses).values([expenseData]);
    }
  }
}

function getExpenseDescription(categoryName: string): string {
  const descriptions: Record<string, string[]> = {
    "Office Supplies": [
      "Printer paper and ink cartridges",
      "Notebooks and pens",
      "Filing cabinets",
      "Office desk supplies",
    ],
    Travel: [
      "Flight to conference",
      "Hotel accommodation",
      "Car rental",
      "Airport parking",
      "Taxi to client meeting",
    ],
    Equipment: [
      "MacBook Pro 16-inch",
      "Monitor and accessories",
      "Office chair",
      "Desk setup",
      "External SSD",
    ],
    Software: [
      "Adobe Creative Cloud subscription",
      "Microsoft 365 annual license",
      "Slack Premium workspace",
      "Figma Professional plan",
      "GitHub Team subscription",
    ],
    Marketing: [
      "Google Ads campaign",
      "LinkedIn advertising",
      "Website hosting",
      "Email marketing platform",
    ],
    "Professional Services": [
      "Legal consultation",
      "Accounting services",
      "Business insurance",
      "Contractor payment",
    ],
    Utilities: [
      "Internet service",
      "Electricity bill",
      "Phone service",
      "Cloud storage",
    ],
    "Meals & Entertainment": [
      "Client dinner meeting",
      "Team lunch",
      "Coffee with prospect",
      "Networking event",
    ],
    Insurance: [
      "Business liability insurance",
      "Professional indemnity",
      "Equipment insurance",
    ],
    Other: [
      "Miscellaneous office expense",
      "Bank fees",
      "Postage and shipping",
    ],
  };

  const options = descriptions[categoryName] || descriptions.Other!;
  return randomChoice(options);
}
