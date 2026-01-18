import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const currenciesRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllCurrencies();
  }),

  updateRates: protectedProcedure.mutation(async ({ ctx }) => {
    // Only allow admin users to update rates
    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can update exchange rates");
    }

    const { fetchExchangeRates } = await import("../currency");
    const rates = await fetchExchangeRates();
    await db.updateExchangeRates(rates);

    return { success: true, message: "Exchange rates updated" };
  }),
});