import type { MySql2Database } from "drizzle-orm/mysql2";
import Decimal from "decimal.js";
import { eq } from "drizzle-orm";
import {
  payments,
  invoices,
  type InsertPayment,
} from "../../../drizzle/schema";
import type { SeededInvoice } from "./invoices";
import {
  PAYMENT_METHOD_DISTRIBUTION,
  PAYMENT_STATUS_DISTRIBUTION,
  CRYPTO_CURRENCIES,
} from "../data/constants";
import { randomInt, randomChoice, weightedChoice } from "../utils";

export async function seedPayments(
  db: any,
  seededInvoices: SeededInvoice[]
): Promise<void> {
  const paidInvoices = seededInvoices.filter(
    inv => inv.status === "paid" || inv.status === "overdue"
  );

  for (const invoice of paidInvoices) {
    const isPartialPayment = Math.random() < 0.1;
    const numPayments = isPartialPayment ? randomInt(2, 3) : 1;
    const totalAmount = new Decimal(invoice.total);

    if (isPartialPayment) {
      const paymentAmounts = splitAmount(totalAmount, numPayments);
      for (let i = 0; i < numPayments; i++) {
        await createPayment(
          db,
          invoice,
          paymentAmounts[i]!,
          i === numPayments - 1
        );
      }
    } else {
      await createPayment(db, invoice, totalAmount, true);
    }
  }
}

async function createPayment(
  db: any,
  invoice: SeededInvoice,
  amount: Decimal,
  isFinal: boolean
): Promise<void> {
  const method = weightedChoice(
    ["stripe", "manual", "bank_transfer", "check", "cash", "crypto"] as const,
    [
      PAYMENT_METHOD_DISTRIBUTION.stripe,
      PAYMENT_METHOD_DISTRIBUTION.manual,
      PAYMENT_METHOD_DISTRIBUTION.bank_transfer,
      PAYMENT_METHOD_DISTRIBUTION.check,
      PAYMENT_METHOD_DISTRIBUTION.cash,
      PAYMENT_METHOD_DISTRIBUTION.crypto,
    ]
  );

  const status = weightedChoice(
    ["completed", "pending", "failed", "refunded"] as const,
    [
      PAYMENT_STATUS_DISTRIBUTION.completed,
      PAYMENT_STATUS_DISTRIBUTION.pending,
      PAYMENT_STATUS_DISTRIBUTION.failed,
      PAYMENT_STATUS_DISTRIBUTION.refunded,
    ]
  );

  const now = new Date();
  const paymentDate = new Date(
    now.getTime() - randomInt(1, 30) * 24 * 60 * 60 * 1000
  );

  const paymentData: InsertPayment = {
    invoiceId: invoice.id,
    userId: invoice.userId,
    amount: amount.toFixed(8),
    paymentMethod: method,
    status,
    paymentDate,
  };

  if (method === "stripe") {
    paymentData.stripePaymentIntentId = `pi_seed_${randomInt(100000, 999999)}`;
  } else if (method === "crypto") {
    const crypto = randomChoice(CRYPTO_CURRENCIES);
    paymentData.cryptoCurrency = crypto.code;
    paymentData.cryptoAmount = amount.div(50000).toFixed(18);
    paymentData.cryptoNetwork = crypto.network;
    paymentData.cryptoTxHash = `0x${randomInt(1000000000, 9999999999).toString(16)}${"a".repeat(50)}`;
  }

  await db.insert(payments).values([paymentData]);

  if (status === "completed") {
    const [currentInvoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoice.id));

    if (currentInvoice) {
      const currentPaid = new Decimal(currentInvoice.amountPaid || "0");
      const newPaid = currentPaid.plus(amount);

      const updates: Record<string, any> = {
        amountPaid: newPaid.toFixed(8),
      };

      if (isFinal && newPaid.gte(new Decimal(currentInvoice.total))) {
        updates.status = "paid";
        updates.paidAt = paymentDate;
      }

      await db.update(invoices).set(updates).where(eq(invoices.id, invoice.id));
    }
  }
}

function splitAmount(total: Decimal, parts: number): Decimal[] {
  const amounts: Decimal[] = [];
  let remaining = total;

  for (let i = 0; i < parts - 1; i++) {
    const maxPart = remaining.times(0.6);
    const minPart = remaining.times(0.2);
    const part = new Decimal(
      minPart.plus(maxPart.minus(minPart).times(Math.random())).toFixed(2)
    );
    amounts.push(part);
    remaining = remaining.minus(part);
  }

  amounts.push(remaining);
  return amounts;
}
