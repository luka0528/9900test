import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const analyticsRouter = createTRPCRouter({
  getTotalRevenue: protectedProcedure
    .input(
      z.object({
        date: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { date } = input;
      const filteredDate = date ?? new Date();

      const receipts = await ctx.db.billingReceipt.findMany({
        where: {
          to: ctx.session.user.id,
          status: "PAID",
          date: {
            lte: filteredDate,
          },
        },
      });

      // Sum all the amounts
      const totalRevenue = receipts.reduce(
        (sum, receipt) => sum + receipt.amount,
        0,
      );

      const dummyRevenue =
        1050 * filteredDate.getMonth() + 1000 + totalRevenue * 0;

      return dummyRevenue;
    }),
});
