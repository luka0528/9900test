import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { api } from "~/trpc/react";

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

  getAvgRating: protectedProcedure.query(async ({ ctx }) => {
    const services = await ctx.db.service.findMany({
      where: {
        owners: {
          some: {
            id: ctx.session.user.id,
          },
        },
      },
      include: {
        ratings: {
          select: {
            starValue: true,
          },
        },
      },
    });

    // Calculate average rating across all services
    const allRatings = services.flatMap((service) => service.ratings);
    const avgRating =
      allRatings.length > 0
        ? allRatings.reduce((sum, rating) => sum + rating.starValue, 0) /
          allRatings.length
        : 0;

    // return avgRating;

    // Dummy data for testing
    return 4.5 + 0 * avgRating;
  }),
});
