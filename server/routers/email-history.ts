import { protectedProcedure, router, TRPCError } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const emailHistoryRouter = router({
  // Get paginated email logs
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
          emailType: z.enum(["invoice", "reminder", "receipt"]).optional(),
          deliveryStatus: z
            .enum([
              "sent",
              "delivered",
              "opened",
              "clicked",
              "bounced",
              "complained",
              "failed",
            ])
            .optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await db.getEmailLogsByUserId(ctx.user.id, input || {});
    }),

  // Get single email log details
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const emailLog = await db.getEmailLogById(input.id);
      if (!emailLog || emailLog.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email log not found",
        });
      }
      return emailLog;
    }),

  // Retry a failed email
  retry: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const emailLog = await db.getEmailLogById(input.id);
      if (!emailLog || emailLog.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email log not found",
        });
      }

      if (emailLog.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email was already sent successfully",
        });
      }

      const { retryEmail } = await import("../lib/email-retry");
      return await retryEmail(input.id);
    }),

  // Get email statistics
  stats: protectedProcedure.query(async ({ ctx }) => {
    const { logs } = await db.getEmailLogsByUserId(ctx.user.id, {
      limit: 1000,
    });

    const stats = {
      total: logs.length,
      sent: logs.filter(l => l.deliveryStatus === "sent").length,
      delivered: logs.filter(l => l.deliveryStatus === "delivered").length,
      opened: logs.filter(l => l.deliveryStatus === "opened").length,
      clicked: logs.filter(l => l.deliveryStatus === "clicked").length,
      bounced: logs.filter(l => l.deliveryStatus === "bounced").length,
      failed: logs.filter(l => !l.success).length,
      byType: {
        invoice: logs.filter(l => l.emailType === "invoice").length,
        reminder: logs.filter(l => l.emailType === "reminder").length,
        receipt: logs.filter(l => l.emailType === "receipt").length,
      },
    };

    return stats;
  }),

  // Get email analytics over time for charts
  analyticsOverTime: protectedProcedure
    .input(
      z.object({
        period: z.enum(["daily", "weekly", "monthly"]).default("daily"),
        days: z.number().min(7).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const { logs } = await db.getEmailLogsByUserId(ctx.user.id, {
        limit: 10000,
      });

      const now = new Date();
      const startDate = new Date(
        now.getTime() - input.days * 24 * 60 * 60 * 1000
      );

      // Filter logs within the date range
      const filteredLogs = logs.filter(l => new Date(l.sentAt) >= startDate);

      // Group by period
      const groupByPeriod = (date: Date): string => {
        if (input.period === "daily") {
          return date.toISOString().split("T")[0];
        } else if (input.period === "weekly") {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          return weekStart.toISOString().split("T")[0];
        } else {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        }
      };

      // Initialize data structure
      const periodData: Record<
        string,
        {
          period: string;
          sent: number;
          delivered: number;
          opened: number;
          clicked: number;
          bounced: number;
        }
      > = {};

      // Generate all periods in range
      const currentDate = new Date(startDate);
      while (currentDate <= now) {
        const periodKey = groupByPeriod(currentDate);
        if (!periodData[periodKey]) {
          periodData[periodKey] = {
            period: periodKey,
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
          };
        }
        if (input.period === "daily") {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (input.period === "weekly") {
          currentDate.setDate(currentDate.getDate() + 7);
        } else {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }

      // Aggregate data
      for (const log of filteredLogs) {
        const periodKey = groupByPeriod(new Date(log.sentAt));
        if (periodData[periodKey]) {
          periodData[periodKey].sent++;
          if (
            log.deliveryStatus === "delivered" ||
            log.deliveryStatus === "opened" ||
            log.deliveryStatus === "clicked"
          ) {
            periodData[periodKey].delivered++;
          }
          if (
            log.deliveryStatus === "opened" ||
            log.deliveryStatus === "clicked"
          ) {
            periodData[periodKey].opened++;
          }
          if (log.deliveryStatus === "clicked") {
            periodData[periodKey].clicked++;
          }
          if (log.deliveryStatus === "bounced") {
            periodData[periodKey].bounced++;
          }
        }
      }

      // Convert to array and sort
      const dataPoints = Object.values(periodData).sort((a, b) =>
        a.period.localeCompare(b.period)
      );

      // Calculate rates
      const dataWithRates = dataPoints.map(d => ({
        ...d,
        openRate:
          d.delivered > 0 ? Math.round((d.opened / d.delivered) * 100) : 0,
        clickRate:
          d.opened > 0 ? Math.round((d.clicked / d.opened) * 100) : 0,
        bounceRate: d.sent > 0 ? Math.round((d.bounced / d.sent) * 100) : 0,
      }));

      // Calculate overall stats
      const totalSent = filteredLogs.length;
      const totalDelivered = filteredLogs.filter(l =>
        ["delivered", "opened", "clicked"].includes(l.deliveryStatus || "")
      ).length;
      const totalOpened = filteredLogs.filter(l =>
        ["opened", "clicked"].includes(l.deliveryStatus || "")
      ).length;
      const totalClicked = filteredLogs.filter(
        l => l.deliveryStatus === "clicked"
      ).length;

      // Calculate previous period for comparison
      const prevStartDate = new Date(
        startDate.getTime() - input.days * 24 * 60 * 60 * 1000
      );
      const prevLogs = logs.filter(l => {
        const sentAt = new Date(l.sentAt);
        return sentAt >= prevStartDate && sentAt < startDate;
      });

      const prevDelivered = prevLogs.filter(l =>
        ["delivered", "opened", "clicked"].includes(l.deliveryStatus || "")
      ).length;
      const prevOpened = prevLogs.filter(l =>
        ["opened", "clicked"].includes(l.deliveryStatus || "")
      ).length;

      const currentOpenRate =
        totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
      const prevOpenRate =
        prevDelivered > 0 ? (prevOpened / prevDelivered) * 100 : 0;
      const openRateChange = currentOpenRate - prevOpenRate;

      const currentClickRate =
        totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
      const prevClicked = prevLogs.filter(
        l => l.deliveryStatus === "clicked"
      ).length;
      const prevClickRate =
        prevOpened > 0 ? (prevClicked / prevOpened) * 100 : 0;
      const clickRateChange = currentClickRate - prevClickRate;

      return {
        dataPoints: dataWithRates,
        summary: {
          totalSent,
          totalDelivered,
          totalOpened,
          totalClicked,
          openRate: Math.round(currentOpenRate * 10) / 10,
          clickRate: Math.round(currentClickRate * 10) / 10,
          openRateChange: Math.round(openRateChange * 10) / 10,
          clickRateChange: Math.round(clickRateChange * 10) / 10,
        },
      };
    }),
});