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
          to: {
            id: ctx.session.user.id,
          },
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

  getNumCustomersPerService: protectedProcedure.query(async ({ ctx }) => {
    const services = await ctx.db.service.findMany({
      where: {
        owners: {
          some: {
            id: ctx.session.user.id,
          },
        },
      },
      include: {
        subscriptionTiers: {
          include: {
            consumers: true,
          },
        },
      },
    });

    // Map of Service to the Customer count.
    const serviceToCustomers = new Map<string, number>();

    services.forEach((service) => {
      const customerCount = service.subscriptionTiers.reduce(
        (tierSum, tier) => {
          return tierSum + tier.consumers.length;
        },
        0,
      );

      serviceToCustomers.set(service.name, customerCount);
    });

    // return serviceToCustomers;\

    // Dummy data for testing
    const dummyData = new Map<string, number>();
    dummyData.set("Service A", 100);
    dummyData.set("Service B", 400);
    dummyData.set("Service C", 300);
    dummyData.set("Service D", 200);

    return dummyData;
  }),

  getTotalCustomers: protectedProcedure.query(async ({ ctx }) => {
    const services = await ctx.db.service.findMany({
      where: {
        owners: {
          some: {
            id: ctx.session.user.id,
          },
        },
      },
      include: {
        subscriptionTiers: {
          include: {
            consumers: true,
          },
        },
      },
    });

    const totalCustomers = services.reduce((sum, service) => {
      return (
        sum +
        service.subscriptionTiers.reduce((tierSum, tier) => {
          return tierSum + tier.consumers.length;
        }, 0)
      );
    }, 0);

    // Return totalCustomers

    // Dummy data for testing
    return 3250 + 0 * totalCustomers;
  }),

  getRevenueOverTimeByService: protectedProcedure.query(async ({ ctx }) => {
    const receipts = await ctx.db.billingReceipt.findMany({
      where: {
        to: {
          id: ctx.session.user.id,
        },
        status: "PAID",
      },
      orderBy: {
        date: "asc",
      },
      select: {
        date: true,
        amount: true,
        subscriptionTier: {
          select: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const serviceNames = new Set(
      receipts.map((receipt) => receipt.subscriptionTier?.service?.name),
    );

    const groupedByDate = new Map<string, Map<string, number>>();
    const today = new Date();
    const startDate = new Date(
      today.getFullYear() - 1,
      today.getMonth(),
      today.getDay(),
    );

    const currDate = new Date(startDate);
    while (currDate <= today) {
      const dateStr = currDate.toISOString().split("T")[0]!;

      const serviceMap = new Map<string, number>();
      for (const service of serviceNames) {
        serviceMap.set(service, 0);
      }

      groupedByDate.set(dateStr, serviceMap);

      currDate.setDate(currDate.getDate() + 1);
    }

    for (const receipt of receipts) {
      const dateStr = receipt.date.toISOString().split("T")[0]!;
      const serviceName = receipt.subscriptionTier?.service?.name;
      const amount = receipt.amount;

      const entry = groupedByDate.get(dateStr)!;
      entry.set(serviceName, (entry.get(serviceName) ?? 0) + amount);
    }

    // Transform into a single object containing the date & all services to revenues mapped.
    const revenueOverTime = Array.from(groupedByDate.entries()).map(
      ([date, services]) => {
        const revenue = Array.from(services.entries()).map(
          ([serviceName, amount]) => ({
            serviceName,
            amount,
          }),
        );

        return {
          date,
          revenue,
        };
      },
    );

    console.log("Revenue Over Time: ", revenueOverTime);
    // return revenueOverTime;

    // Dummy data for testing
    const chartData = [
      { date: "2024-04-08", GreenAPI: 3, YellowAPI: 14, RedAPI: 11 },
      { date: "2024-04-09", GreenAPI: 3, YellowAPI: 11, RedAPI: 25 },
      { date: "2024-04-10", GreenAPI: 2, YellowAPI: 10, RedAPI: 20 },
      { date: "2024-04-11", GreenAPI: 5, YellowAPI: 12, RedAPI: 13 },
      { date: "2024-04-12", GreenAPI: 2, YellowAPI: 9, RedAPI: 22 },
      { date: "2024-04-13", GreenAPI: 0, YellowAPI: 14, RedAPI: 22 },
      { date: "2024-04-14", GreenAPI: 4, YellowAPI: 7, RedAPI: 21 },
      { date: "2024-04-15", GreenAPI: 8, YellowAPI: 15, RedAPI: 16 },
      { date: "2024-04-16", GreenAPI: 3, YellowAPI: 15, RedAPI: 20 },
      { date: "2024-04-17", GreenAPI: 8, YellowAPI: 13, RedAPI: 25 },
      { date: "2024-04-18", GreenAPI: 2, YellowAPI: 13, RedAPI: 15 },
      { date: "2024-04-19", GreenAPI: 8, YellowAPI: 10, RedAPI: 10 },
      { date: "2024-04-20", GreenAPI: 1, YellowAPI: 11, RedAPI: 14 },
      { date: "2024-04-21", GreenAPI: 2, YellowAPI: 14, RedAPI: 22 },
      { date: "2024-04-22", GreenAPI: 7, YellowAPI: 11, RedAPI: 25 },
      { date: "2024-04-23", GreenAPI: 0, YellowAPI: 15, RedAPI: 16 },
      { date: "2024-04-24", GreenAPI: 8, YellowAPI: 8, RedAPI: 14 },
      { date: "2024-04-25", GreenAPI: 0, YellowAPI: 7, RedAPI: 15 },
      { date: "2024-04-26", GreenAPI: 3, YellowAPI: 12, RedAPI: 20 },
      { date: "2024-04-27", GreenAPI: 3, YellowAPI: 5, RedAPI: 11 },
      { date: "2024-04-28", GreenAPI: 6, YellowAPI: 5, RedAPI: 12 },
      { date: "2024-04-29", GreenAPI: 8, YellowAPI: 15, RedAPI: 18 },
      { date: "2024-04-30", GreenAPI: 4, YellowAPI: 11, RedAPI: 11 },
      { date: "2024-05-01", GreenAPI: 8, YellowAPI: 6, RedAPI: 23 },
      { date: "2024-05-02", GreenAPI: 3, YellowAPI: 6, RedAPI: 21 },
      { date: "2024-05-03", GreenAPI: 1, YellowAPI: 6, RedAPI: 21 },
      { date: "2024-05-04", GreenAPI: 2, YellowAPI: 5, RedAPI: 11 },
      { date: "2024-05-05", GreenAPI: 7, YellowAPI: 8, RedAPI: 20 },
      { date: "2024-05-06", GreenAPI: 5, YellowAPI: 5, RedAPI: 24 },
      { date: "2024-05-07", GreenAPI: 2, YellowAPI: 11, RedAPI: 17 },
      { date: "2024-05-08", GreenAPI: 0, YellowAPI: 12, RedAPI: 14 },
      { date: "2024-05-09", GreenAPI: 6, YellowAPI: 9, RedAPI: 21 },
      { date: "2024-05-10", GreenAPI: 0, YellowAPI: 5, RedAPI: 25 },
      { date: "2024-05-11", GreenAPI: 3, YellowAPI: 14, RedAPI: 22 },
      { date: "2024-05-12", GreenAPI: 4, YellowAPI: 9, RedAPI: 13 },
      { date: "2024-05-13", GreenAPI: 6, YellowAPI: 6, RedAPI: 17 },
      { date: "2024-05-14", GreenAPI: 8, YellowAPI: 10, RedAPI: 21 },
      { date: "2024-05-15", GreenAPI: 7, YellowAPI: 5, RedAPI: 25 },
      { date: "2024-05-16", GreenAPI: 0, YellowAPI: 11, RedAPI: 14 },
      { date: "2024-05-17", GreenAPI: 4, YellowAPI: 15, RedAPI: 20 },
      { date: "2024-05-18", GreenAPI: 6, YellowAPI: 10, RedAPI: 25 },
      { date: "2024-05-19", GreenAPI: 7, YellowAPI: 14, RedAPI: 17 },
      { date: "2024-05-20", GreenAPI: 4, YellowAPI: 13, RedAPI: 10 },
      { date: "2024-05-21", GreenAPI: 4, YellowAPI: 5, RedAPI: 14 },
      { date: "2024-05-22", GreenAPI: 0, YellowAPI: 7, RedAPI: 18 },
      { date: "2024-05-23", GreenAPI: 1, YellowAPI: 15, RedAPI: 22 },
      { date: "2024-05-24", GreenAPI: 5, YellowAPI: 10, RedAPI: 15 },
      { date: "2024-05-25", GreenAPI: 3, YellowAPI: 9, RedAPI: 23 },
      { date: "2024-05-26", GreenAPI: 6, YellowAPI: 13, RedAPI: 16 },
      { date: "2024-05-27", GreenAPI: 6, YellowAPI: 13, RedAPI: 18 },
      { date: "2024-05-28", GreenAPI: 4, YellowAPI: 5, RedAPI: 15 },
      { date: "2024-05-29", GreenAPI: 0, YellowAPI: 12, RedAPI: 22 },
      { date: "2024-05-30", GreenAPI: 2, YellowAPI: 14, RedAPI: 12 },
      { date: "2024-05-31", GreenAPI: 0, YellowAPI: 12, RedAPI: 15 },
      { date: "2024-06-01", GreenAPI: 6, YellowAPI: 10, RedAPI: 14 },
      { date: "2024-06-02", GreenAPI: 6, YellowAPI: 8, RedAPI: 18 },
      { date: "2024-06-03", GreenAPI: 8, YellowAPI: 12, RedAPI: 16 },
      { date: "2024-06-04", GreenAPI: 6, YellowAPI: 8, RedAPI: 12 },
      { date: "2024-06-05", GreenAPI: 3, YellowAPI: 12, RedAPI: 15 },
      { date: "2024-06-06", GreenAPI: 3, YellowAPI: 12, RedAPI: 25 },
      { date: "2024-06-07", GreenAPI: 6, YellowAPI: 15, RedAPI: 16 },
      { date: "2024-06-08", GreenAPI: 0, YellowAPI: 11, RedAPI: 15 },
      { date: "2024-06-09", GreenAPI: 0, YellowAPI: 6, RedAPI: 16 },
      { date: "2024-06-10", GreenAPI: 1, YellowAPI: 15, RedAPI: 22 },
      { date: "2024-06-11", GreenAPI: 1, YellowAPI: 5, RedAPI: 13 },
      { date: "2024-06-12", GreenAPI: 1, YellowAPI: 8, RedAPI: 24 },
      { date: "2024-06-13", GreenAPI: 5, YellowAPI: 15, RedAPI: 22 },
      { date: "2024-06-14", GreenAPI: 1, YellowAPI: 6, RedAPI: 19 },
      { date: "2024-06-15", GreenAPI: 2, YellowAPI: 12, RedAPI: 10 },
      { date: "2024-06-16", GreenAPI: 6, YellowAPI: 13, RedAPI: 11 },
      { date: "2024-06-17", GreenAPI: 6, YellowAPI: 13, RedAPI: 23 },
      { date: "2024-06-18", GreenAPI: 8, YellowAPI: 13, RedAPI: 20 },
      { date: "2024-06-19", GreenAPI: 0, YellowAPI: 11, RedAPI: 13 },
      { date: "2024-06-20", GreenAPI: 1, YellowAPI: 14, RedAPI: 18 },
      { date: "2024-06-21", GreenAPI: 2, YellowAPI: 9, RedAPI: 15 },
      { date: "2024-06-22", GreenAPI: 8, YellowAPI: 5, RedAPI: 23 },
      { date: "2024-06-23", GreenAPI: 6, YellowAPI: 10, RedAPI: 22 },
      { date: "2024-06-24", GreenAPI: 6, YellowAPI: 7, RedAPI: 16 },
      { date: "2024-06-25", GreenAPI: 4, YellowAPI: 15, RedAPI: 15 },
      { date: "2024-06-26", GreenAPI: 3, YellowAPI: 5, RedAPI: 19 },
      { date: "2024-06-27", GreenAPI: 6, YellowAPI: 13, RedAPI: 11 },
      { date: "2024-06-28", GreenAPI: 7, YellowAPI: 11, RedAPI: 20 },
      { date: "2024-06-29", GreenAPI: 5, YellowAPI: 14, RedAPI: 24 },
      { date: "2024-06-30", GreenAPI: 7, YellowAPI: 13, RedAPI: 18 },
      { date: "2024-07-01", GreenAPI: 6, YellowAPI: 13, RedAPI: 12 },
      { date: "2024-07-02", GreenAPI: 3, YellowAPI: 10, RedAPI: 25 },
      { date: "2024-07-03", GreenAPI: 3, YellowAPI: 15, RedAPI: 25 },
      { date: "2024-07-04", GreenAPI: 0, YellowAPI: 7, RedAPI: 20 },
      { date: "2024-07-05", GreenAPI: 7, YellowAPI: 15, RedAPI: 12 },
      { date: "2024-07-06", GreenAPI: 6, YellowAPI: 13, RedAPI: 14 },
      { date: "2024-07-07", GreenAPI: 0, YellowAPI: 14, RedAPI: 20 },
      { date: "2024-07-08", GreenAPI: 7, YellowAPI: 14, RedAPI: 21 },
      { date: "2024-07-09", GreenAPI: 0, YellowAPI: 13, RedAPI: 19 },
      { date: "2024-07-10", GreenAPI: 5, YellowAPI: 15, RedAPI: 13 },
      { date: "2024-07-11", GreenAPI: 3, YellowAPI: 11, RedAPI: 21 },
      { date: "2024-07-12", GreenAPI: 5, YellowAPI: 14, RedAPI: 22 },
      { date: "2024-07-13", GreenAPI: 7, YellowAPI: 6, RedAPI: 13 },
      { date: "2024-07-14", GreenAPI: 0, YellowAPI: 13, RedAPI: 13 },
      { date: "2024-07-15", GreenAPI: 7, YellowAPI: 10, RedAPI: 18 },
      { date: "2024-07-16", GreenAPI: 5, YellowAPI: 14, RedAPI: 22 },
      { date: "2024-07-17", GreenAPI: 6, YellowAPI: 8, RedAPI: 24 },
      { date: "2024-07-18", GreenAPI: 4, YellowAPI: 14, RedAPI: 22 },
      { date: "2024-07-19", GreenAPI: 0, YellowAPI: 9, RedAPI: 13 },
      { date: "2024-07-20", GreenAPI: 5, YellowAPI: 5, RedAPI: 21 },
      { date: "2024-07-21", GreenAPI: 1, YellowAPI: 14, RedAPI: 22 },
      { date: "2024-07-22", GreenAPI: 8, YellowAPI: 7, RedAPI: 10 },
      { date: "2024-07-23", GreenAPI: 6, YellowAPI: 7, RedAPI: 14 },
      { date: "2024-07-24", GreenAPI: 8, YellowAPI: 14, RedAPI: 16 },
      { date: "2024-07-25", GreenAPI: 3, YellowAPI: 10, RedAPI: 11 },
      { date: "2024-07-26", GreenAPI: 4, YellowAPI: 11, RedAPI: 14 },
      { date: "2024-07-27", GreenAPI: 5, YellowAPI: 13, RedAPI: 18 },
      { date: "2024-07-28", GreenAPI: 3, YellowAPI: 12, RedAPI: 22 },
      { date: "2024-07-29", GreenAPI: 0, YellowAPI: 6, RedAPI: 20 },
      { date: "2024-07-30", GreenAPI: 6, YellowAPI: 13, RedAPI: 24 },
      { date: "2024-07-31", GreenAPI: 7, YellowAPI: 11, RedAPI: 23 },
      { date: "2024-08-01", GreenAPI: 8, YellowAPI: 6, RedAPI: 24 },
      { date: "2024-08-02", GreenAPI: 2, YellowAPI: 13, RedAPI: 23 },
      { date: "2024-08-03", GreenAPI: 2, YellowAPI: 6, RedAPI: 21 },
      { date: "2024-08-04", GreenAPI: 3, YellowAPI: 11, RedAPI: 13 },
      { date: "2024-08-05", GreenAPI: 1, YellowAPI: 5, RedAPI: 12 },
      { date: "2024-08-06", GreenAPI: 5, YellowAPI: 5, RedAPI: 12 },
      { date: "2024-08-07", GreenAPI: 5, YellowAPI: 15, RedAPI: 18 },
      { date: "2024-08-08", GreenAPI: 2, YellowAPI: 9, RedAPI: 14 },
      { date: "2024-08-09", GreenAPI: 3, YellowAPI: 5, RedAPI: 14 },
      { date: "2024-08-10", GreenAPI: 0, YellowAPI: 8, RedAPI: 10 },
      { date: "2024-08-11", GreenAPI: 0, YellowAPI: 15, RedAPI: 18 },
      { date: "2024-08-12", GreenAPI: 4, YellowAPI: 7, RedAPI: 11 },
      { date: "2024-08-13", GreenAPI: 7, YellowAPI: 14, RedAPI: 21 },
      { date: "2024-08-14", GreenAPI: 3, YellowAPI: 12, RedAPI: 17 },
      { date: "2024-08-15", GreenAPI: 5, YellowAPI: 15, RedAPI: 13 },
      { date: "2024-08-16", GreenAPI: 4, YellowAPI: 8, RedAPI: 23 },
      { date: "2024-08-17", GreenAPI: 0, YellowAPI: 14, RedAPI: 10 },
      { date: "2024-08-18", GreenAPI: 3, YellowAPI: 9, RedAPI: 17 },
      { date: "2024-08-19", GreenAPI: 4, YellowAPI: 9, RedAPI: 12 },
      { date: "2024-08-20", GreenAPI: 0, YellowAPI: 5, RedAPI: 20 },
      { date: "2024-08-21", GreenAPI: 1, YellowAPI: 12, RedAPI: 19 },
      { date: "2024-08-22", GreenAPI: 0, YellowAPI: 15, RedAPI: 16 },
      { date: "2024-08-23", GreenAPI: 7, YellowAPI: 7, RedAPI: 18 },
      { date: "2024-08-24", GreenAPI: 4, YellowAPI: 5, RedAPI: 17 },
      { date: "2024-08-25", GreenAPI: 8, YellowAPI: 13, RedAPI: 13 },
      { date: "2024-08-26", GreenAPI: 1, YellowAPI: 11, RedAPI: 14 },
      { date: "2024-08-27", GreenAPI: 6, YellowAPI: 6, RedAPI: 24 },
      { date: "2024-08-28", GreenAPI: 5, YellowAPI: 5, RedAPI: 15 },
      { date: "2024-08-29", GreenAPI: 2, YellowAPI: 10, RedAPI: 17 },
      { date: "2024-08-30", GreenAPI: 4, YellowAPI: 12, RedAPI: 23 },
      { date: "2024-08-31", GreenAPI: 4, YellowAPI: 5, RedAPI: 12 },
      { date: "2024-09-01", GreenAPI: 1, YellowAPI: 15, RedAPI: 22 },
      { date: "2024-09-02", GreenAPI: 0, YellowAPI: 11, RedAPI: 11 },
      { date: "2024-09-03", GreenAPI: 4, YellowAPI: 6, RedAPI: 11 },
      { date: "2024-09-04", GreenAPI: 6, YellowAPI: 10, RedAPI: 11 },
      { date: "2024-09-05", GreenAPI: 4, YellowAPI: 11, RedAPI: 16 },
      { date: "2024-09-06", GreenAPI: 6, YellowAPI: 13, RedAPI: 17 },
      { date: "2024-09-07", GreenAPI: 6, YellowAPI: 11, RedAPI: 22 },
      { date: "2024-09-08", GreenAPI: 2, YellowAPI: 9, RedAPI: 15 },
      { date: "2024-09-09", GreenAPI: 4, YellowAPI: 7, RedAPI: 22 },
      { date: "2024-09-10", GreenAPI: 0, YellowAPI: 6, RedAPI: 14 },
      { date: "2024-09-11", GreenAPI: 0, YellowAPI: 10, RedAPI: 22 },
      { date: "2024-09-12", GreenAPI: 5, YellowAPI: 6, RedAPI: 23 },
      { date: "2024-09-13", GreenAPI: 1, YellowAPI: 12, RedAPI: 22 },
      { date: "2024-09-14", GreenAPI: 1, YellowAPI: 7, RedAPI: 12 },
      { date: "2024-09-15", GreenAPI: 2, YellowAPI: 7, RedAPI: 20 },
      { date: "2024-09-16", GreenAPI: 6, YellowAPI: 15, RedAPI: 11 },
      { date: "2024-09-17", GreenAPI: 8, YellowAPI: 5, RedAPI: 10 },
      { date: "2024-09-18", GreenAPI: 0, YellowAPI: 11, RedAPI: 18 },
      { date: "2024-09-19", GreenAPI: 3, YellowAPI: 14, RedAPI: 16 },
      { date: "2024-09-20", GreenAPI: 3, YellowAPI: 14, RedAPI: 20 },
      { date: "2024-09-21", GreenAPI: 5, YellowAPI: 9, RedAPI: 15 },
      { date: "2024-09-22", GreenAPI: 1, YellowAPI: 8, RedAPI: 14 },
      { date: "2024-09-23", GreenAPI: 3, YellowAPI: 10, RedAPI: 16 },
      { date: "2024-09-24", GreenAPI: 8, YellowAPI: 13, RedAPI: 18 },
      { date: "2024-09-25", GreenAPI: 1, YellowAPI: 14, RedAPI: 25 },
      { date: "2024-09-26", GreenAPI: 8, YellowAPI: 13, RedAPI: 11 },
      { date: "2024-09-27", GreenAPI: 8, YellowAPI: 11, RedAPI: 17 },
      { date: "2024-09-28", GreenAPI: 5, YellowAPI: 14, RedAPI: 23 },
      { date: "2024-09-29", GreenAPI: 2, YellowAPI: 15, RedAPI: 20 },
      { date: "2024-09-30", GreenAPI: 5, YellowAPI: 14, RedAPI: 18 },
      { date: "2024-10-01", GreenAPI: 2, YellowAPI: 12, RedAPI: 21 },
      { date: "2024-10-02", GreenAPI: 4, YellowAPI: 15, RedAPI: 19 },
      { date: "2024-10-03", GreenAPI: 5, YellowAPI: 8, RedAPI: 11 },
      { date: "2024-10-04", GreenAPI: 8, YellowAPI: 8, RedAPI: 15 },
      { date: "2024-10-05", GreenAPI: 8, YellowAPI: 5, RedAPI: 17 },
      { date: "2024-10-06", GreenAPI: 8, YellowAPI: 12, RedAPI: 23 },
      { date: "2024-10-07", GreenAPI: 3, YellowAPI: 8, RedAPI: 13 },
      { date: "2024-10-08", GreenAPI: 5, YellowAPI: 8, RedAPI: 14 },
      { date: "2024-10-09", GreenAPI: 0, YellowAPI: 15, RedAPI: 10 },
      { date: "2024-10-10", GreenAPI: 6, YellowAPI: 6, RedAPI: 20 },
      { date: "2024-10-11", GreenAPI: 7, YellowAPI: 15, RedAPI: 15 },
      { date: "2024-10-12", GreenAPI: 6, YellowAPI: 5, RedAPI: 12 },
      { date: "2024-10-13", GreenAPI: 2, YellowAPI: 9, RedAPI: 13 },
      { date: "2024-10-14", GreenAPI: 1, YellowAPI: 6, RedAPI: 16 },
      { date: "2024-10-15", GreenAPI: 1, YellowAPI: 8, RedAPI: 13 },
      { date: "2024-10-16", GreenAPI: 1, YellowAPI: 9, RedAPI: 19 },
      { date: "2024-10-17", GreenAPI: 7, YellowAPI: 5, RedAPI: 23 },
      { date: "2024-10-18", GreenAPI: 4, YellowAPI: 11, RedAPI: 19 },
      { date: "2024-10-19", GreenAPI: 6, YellowAPI: 14, RedAPI: 10 },
      { date: "2024-10-20", GreenAPI: 6, YellowAPI: 8, RedAPI: 15 },
      { date: "2024-10-21", GreenAPI: 6, YellowAPI: 8, RedAPI: 11 },
      { date: "2024-10-22", GreenAPI: 1, YellowAPI: 8, RedAPI: 17 },
      { date: "2024-10-23", GreenAPI: 0, YellowAPI: 8, RedAPI: 22 },
      { date: "2024-10-24", GreenAPI: 8, YellowAPI: 6, RedAPI: 10 },
      { date: "2024-10-25", GreenAPI: 6, YellowAPI: 11, RedAPI: 17 },
      { date: "2024-10-26", GreenAPI: 7, YellowAPI: 6, RedAPI: 11 },
      { date: "2024-10-27", GreenAPI: 8, YellowAPI: 6, RedAPI: 16 },
      { date: "2024-10-28", GreenAPI: 3, YellowAPI: 8, RedAPI: 24 },
      { date: "2024-10-29", GreenAPI: 1, YellowAPI: 8, RedAPI: 24 },
      { date: "2024-10-30", GreenAPI: 8, YellowAPI: 13, RedAPI: 24 },
      { date: "2024-10-31", GreenAPI: 1, YellowAPI: 10, RedAPI: 17 },
      { date: "2024-11-01", GreenAPI: 5, YellowAPI: 14, RedAPI: 21 },
      { date: "2024-11-02", GreenAPI: 7, YellowAPI: 15, RedAPI: 15 },
      { date: "2024-11-03", GreenAPI: 2, YellowAPI: 7, RedAPI: 25 },
      { date: "2024-11-04", GreenAPI: 6, YellowAPI: 6, RedAPI: 17 },
      { date: "2024-11-05", GreenAPI: 6, YellowAPI: 10, RedAPI: 14 },
      { date: "2024-11-06", GreenAPI: 0, YellowAPI: 10, RedAPI: 20 },
      { date: "2024-11-07", GreenAPI: 1, YellowAPI: 12, RedAPI: 11 },
      { date: "2024-11-08", GreenAPI: 4, YellowAPI: 14, RedAPI: 11 },
      { date: "2024-11-09", GreenAPI: 4, YellowAPI: 13, RedAPI: 10 },
      { date: "2024-11-10", GreenAPI: 3, YellowAPI: 5, RedAPI: 14 },
      { date: "2024-11-11", GreenAPI: 5, YellowAPI: 15, RedAPI: 16 },
      { date: "2024-11-12", GreenAPI: 7, YellowAPI: 7, RedAPI: 15 },
      { date: "2024-11-13", GreenAPI: 8, YellowAPI: 9, RedAPI: 25 },
      { date: "2024-11-14", GreenAPI: 7, YellowAPI: 15, RedAPI: 24 },
      { date: "2024-11-15", GreenAPI: 6, YellowAPI: 11, RedAPI: 19 },
      { date: "2024-11-16", GreenAPI: 7, YellowAPI: 5, RedAPI: 14 },
      { date: "2024-11-17", GreenAPI: 8, YellowAPI: 13, RedAPI: 18 },
      { date: "2024-11-18", GreenAPI: 5, YellowAPI: 11, RedAPI: 25 },
      { date: "2024-11-19", GreenAPI: 8, YellowAPI: 8, RedAPI: 19 },
      { date: "2024-11-20", GreenAPI: 0, YellowAPI: 14, RedAPI: 24 },
      { date: "2024-11-21", GreenAPI: 1, YellowAPI: 11, RedAPI: 25 },
      { date: "2024-11-22", GreenAPI: 7, YellowAPI: 11, RedAPI: 13 },
      { date: "2024-11-23", GreenAPI: 6, YellowAPI: 8, RedAPI: 21 },
      { date: "2024-11-24", GreenAPI: 7, YellowAPI: 13, RedAPI: 10 },
      { date: "2024-11-25", GreenAPI: 8, YellowAPI: 10, RedAPI: 16 },
      { date: "2024-11-26", GreenAPI: 0, YellowAPI: 12, RedAPI: 13 },
      { date: "2024-11-27", GreenAPI: 8, YellowAPI: 14, RedAPI: 10 },
      { date: "2024-11-28", GreenAPI: 3, YellowAPI: 6, RedAPI: 15 },
      { date: "2024-11-29", GreenAPI: 4, YellowAPI: 11, RedAPI: 23 },
      { date: "2024-11-30", GreenAPI: 5, YellowAPI: 11, RedAPI: 21 },
      { date: "2024-12-01", GreenAPI: 8, YellowAPI: 14, RedAPI: 25 },
      { date: "2024-12-02", GreenAPI: 0, YellowAPI: 9, RedAPI: 23 },
      { date: "2024-12-03", GreenAPI: 7, YellowAPI: 8, RedAPI: 16 },
      { date: "2024-12-04", GreenAPI: 3, YellowAPI: 15, RedAPI: 17 },
      { date: "2024-12-05", GreenAPI: 4, YellowAPI: 9, RedAPI: 23 },
      { date: "2024-12-06", GreenAPI: 2, YellowAPI: 12, RedAPI: 16 },
      { date: "2024-12-07", GreenAPI: 6, YellowAPI: 5, RedAPI: 25 },
      { date: "2024-12-08", GreenAPI: 4, YellowAPI: 6, RedAPI: 10 },
      { date: "2024-12-09", GreenAPI: 6, YellowAPI: 8, RedAPI: 18 },
      { date: "2024-12-10", GreenAPI: 2, YellowAPI: 12, RedAPI: 10 },
      { date: "2024-12-11", GreenAPI: 0, YellowAPI: 8, RedAPI: 25 },
      { date: "2024-12-12", GreenAPI: 2, YellowAPI: 14, RedAPI: 24 },
      { date: "2024-12-13", GreenAPI: 2, YellowAPI: 7, RedAPI: 15 },
      { date: "2024-12-14", GreenAPI: 4, YellowAPI: 13, RedAPI: 20 },
      { date: "2024-12-15", GreenAPI: 6, YellowAPI: 7, RedAPI: 17 },
      { date: "2024-12-16", GreenAPI: 8, YellowAPI: 5, RedAPI: 23 },
      { date: "2024-12-17", GreenAPI: 0, YellowAPI: 15, RedAPI: 15 },
      { date: "2024-12-18", GreenAPI: 4, YellowAPI: 7, RedAPI: 12 },
      { date: "2024-12-19", GreenAPI: 7, YellowAPI: 12, RedAPI: 14 },
      { date: "2024-12-20", GreenAPI: 5, YellowAPI: 14, RedAPI: 12 },
      { date: "2024-12-21", GreenAPI: 8, YellowAPI: 8, RedAPI: 11 },
      { date: "2024-12-22", GreenAPI: 2, YellowAPI: 9, RedAPI: 24 },
      { date: "2024-12-23", GreenAPI: 4, YellowAPI: 6, RedAPI: 15 },
      { date: "2024-12-24", GreenAPI: 6, YellowAPI: 9, RedAPI: 18 },
      { date: "2024-12-25", GreenAPI: 1, YellowAPI: 8, RedAPI: 17 },
      { date: "2024-12-26", GreenAPI: 8, YellowAPI: 9, RedAPI: 12 },
      { date: "2024-12-27", GreenAPI: 8, YellowAPI: 7, RedAPI: 19 },
      { date: "2024-12-28", GreenAPI: 1, YellowAPI: 7, RedAPI: 18 },
      { date: "2024-12-29", GreenAPI: 3, YellowAPI: 7, RedAPI: 17 },
      { date: "2024-12-30", GreenAPI: 7, YellowAPI: 15, RedAPI: 24 },
      { date: "2024-12-31", GreenAPI: 7, YellowAPI: 15, RedAPI: 13 },
      { date: "2025-01-01", GreenAPI: 2, YellowAPI: 8, RedAPI: 22 },
      { date: "2025-01-02", GreenAPI: 1, YellowAPI: 5, RedAPI: 22 },
      { date: "2025-01-03", GreenAPI: 7, YellowAPI: 6, RedAPI: 23 },
      { date: "2025-01-04", GreenAPI: 3, YellowAPI: 5, RedAPI: 19 },
      { date: "2025-01-05", GreenAPI: 8, YellowAPI: 10, RedAPI: 22 },
      { date: "2025-01-06", GreenAPI: 8, YellowAPI: 14, RedAPI: 12 },
      { date: "2025-01-07", GreenAPI: 1, YellowAPI: 14, RedAPI: 18 },
      { date: "2025-01-08", GreenAPI: 6, YellowAPI: 10, RedAPI: 20 },
      { date: "2025-01-09", GreenAPI: 4, YellowAPI: 10, RedAPI: 23 },
      { date: "2025-01-10", GreenAPI: 2, YellowAPI: 5, RedAPI: 20 },
      { date: "2025-01-11", GreenAPI: 0, YellowAPI: 8, RedAPI: 23 },
      { date: "2025-01-12", GreenAPI: 2, YellowAPI: 15, RedAPI: 17 },
      { date: "2025-01-13", GreenAPI: 5, YellowAPI: 13, RedAPI: 24 },
      { date: "2025-01-14", GreenAPI: 4, YellowAPI: 8, RedAPI: 21 },
      { date: "2025-01-15", GreenAPI: 0, YellowAPI: 9, RedAPI: 25 },
      { date: "2025-01-16", GreenAPI: 7, YellowAPI: 12, RedAPI: 22 },
      { date: "2025-01-17", GreenAPI: 4, YellowAPI: 15, RedAPI: 16 },
      { date: "2025-01-18", GreenAPI: 7, YellowAPI: 8, RedAPI: 21 },
      { date: "2025-01-19", GreenAPI: 2, YellowAPI: 9, RedAPI: 24 },
      { date: "2025-01-20", GreenAPI: 6, YellowAPI: 5, RedAPI: 10 },
      { date: "2025-01-21", GreenAPI: 3, YellowAPI: 13, RedAPI: 17 },
      { date: "2025-01-22", GreenAPI: 2, YellowAPI: 12, RedAPI: 11 },
      { date: "2025-01-23", GreenAPI: 7, YellowAPI: 13, RedAPI: 23 },
      { date: "2025-01-24", GreenAPI: 7, YellowAPI: 13, RedAPI: 24 },
      { date: "2025-01-25", GreenAPI: 0, YellowAPI: 12, RedAPI: 10 },
      { date: "2025-01-26", GreenAPI: 6, YellowAPI: 8, RedAPI: 20 },
      { date: "2025-01-27", GreenAPI: 0, YellowAPI: 14, RedAPI: 16 },
      { date: "2025-01-28", GreenAPI: 2, YellowAPI: 15, RedAPI: 20 },
      { date: "2025-01-29", GreenAPI: 6, YellowAPI: 12, RedAPI: 19 },
      { date: "2025-01-30", GreenAPI: 3, YellowAPI: 12, RedAPI: 12 },
      { date: "2025-01-31", GreenAPI: 2, YellowAPI: 14, RedAPI: 24 },
      { date: "2025-02-01", GreenAPI: 8, YellowAPI: 11, RedAPI: 21 },
      { date: "2025-02-02", GreenAPI: 1, YellowAPI: 9, RedAPI: 25 },
      { date: "2025-02-03", GreenAPI: 7, YellowAPI: 10, RedAPI: 13 },
      { date: "2025-02-04", GreenAPI: 0, YellowAPI: 10, RedAPI: 16 },
      { date: "2025-02-05", GreenAPI: 5, YellowAPI: 12, RedAPI: 10 },
      { date: "2025-02-06", GreenAPI: 3, YellowAPI: 10, RedAPI: 23 },
      { date: "2025-02-07", GreenAPI: 4, YellowAPI: 6, RedAPI: 13 },
      { date: "2025-02-08", GreenAPI: 1, YellowAPI: 14, RedAPI: 21 },
      { date: "2025-02-09", GreenAPI: 5, YellowAPI: 12, RedAPI: 21 },
      { date: "2025-02-10", GreenAPI: 3, YellowAPI: 7, RedAPI: 13 },
      { date: "2025-02-11", GreenAPI: 4, YellowAPI: 12, RedAPI: 18 },
      { date: "2025-02-12", GreenAPI: 7, YellowAPI: 12, RedAPI: 10 },
      { date: "2025-02-13", GreenAPI: 4, YellowAPI: 11, RedAPI: 12 },
      { date: "2025-02-14", GreenAPI: 6, YellowAPI: 11, RedAPI: 25 },
      { date: "2025-02-15", GreenAPI: 1, YellowAPI: 10, RedAPI: 17 },
      { date: "2025-02-16", GreenAPI: 1, YellowAPI: 10, RedAPI: 25 },
      { date: "2025-02-17", GreenAPI: 4, YellowAPI: 13, RedAPI: 20 },
      { date: "2025-02-18", GreenAPI: 5, YellowAPI: 5, RedAPI: 21 },
      { date: "2025-02-19", GreenAPI: 2, YellowAPI: 6, RedAPI: 16 },
      { date: "2025-02-20", GreenAPI: 2, YellowAPI: 6, RedAPI: 22 },
      { date: "2025-02-21", GreenAPI: 4, YellowAPI: 15, RedAPI: 16 },
      { date: "2025-02-22", GreenAPI: 3, YellowAPI: 14, RedAPI: 18 },
      { date: "2025-02-23", GreenAPI: 7, YellowAPI: 13, RedAPI: 25 },
      { date: "2025-02-24", GreenAPI: 6, YellowAPI: 5, RedAPI: 22 },
      { date: "2025-02-25", GreenAPI: 3, YellowAPI: 15, RedAPI: 22 },
      { date: "2025-02-26", GreenAPI: 3, YellowAPI: 12, RedAPI: 12 },
      { date: "2025-02-27", GreenAPI: 5, YellowAPI: 10, RedAPI: 11 },
      { date: "2025-02-28", GreenAPI: 8, YellowAPI: 6, RedAPI: 10 },
      { date: "2025-03-01", GreenAPI: 0, YellowAPI: 15, RedAPI: 15 },
      { date: "2025-03-02", GreenAPI: 7, YellowAPI: 7, RedAPI: 18 },
      { date: "2025-03-03", GreenAPI: 0, YellowAPI: 5, RedAPI: 16 },
      { date: "2025-03-04", GreenAPI: 3, YellowAPI: 5, RedAPI: 25 },
      { date: "2025-03-05", GreenAPI: 8, YellowAPI: 7, RedAPI: 10 },
      { date: "2025-03-06", GreenAPI: 5, YellowAPI: 12, RedAPI: 16 },
      { date: "2025-03-07", GreenAPI: 8, YellowAPI: 14, RedAPI: 11 },
      { date: "2025-03-08", GreenAPI: 5, YellowAPI: 6, RedAPI: 18 },
      { date: "2025-03-09", GreenAPI: 2, YellowAPI: 11, RedAPI: 12 },
      { date: "2025-03-10", GreenAPI: 2, YellowAPI: 5, RedAPI: 15 },
      { date: "2025-03-11", GreenAPI: 1, YellowAPI: 15, RedAPI: 16 },
      { date: "2025-03-12", GreenAPI: 4, YellowAPI: 7, RedAPI: 23 },
      { date: "2025-03-13", GreenAPI: 2, YellowAPI: 10, RedAPI: 18 },
      { date: "2025-03-14", GreenAPI: 6, YellowAPI: 14, RedAPI: 12 },
      { date: "2025-03-15", GreenAPI: 4, YellowAPI: 9, RedAPI: 21 },
      { date: "2025-03-16", GreenAPI: 5, YellowAPI: 10, RedAPI: 18 },
      { date: "2025-03-17", GreenAPI: 4, YellowAPI: 6, RedAPI: 25 },
      { date: "2025-03-18", GreenAPI: 0, YellowAPI: 13, RedAPI: 15 },
      { date: "2025-03-19", GreenAPI: 7, YellowAPI: 8, RedAPI: 13 },
      { date: "2025-03-20", GreenAPI: 8, YellowAPI: 11, RedAPI: 13 },
      { date: "2025-03-21", GreenAPI: 5, YellowAPI: 13, RedAPI: 23 },
      { date: "2025-03-22", GreenAPI: 7, YellowAPI: 13, RedAPI: 25 },
      { date: "2025-03-23", GreenAPI: 8, YellowAPI: 8, RedAPI: 12 },
      { date: "2025-03-24", GreenAPI: 6, YellowAPI: 10, RedAPI: 24 },
      { date: "2025-03-25", GreenAPI: 2, YellowAPI: 8, RedAPI: 22 },
      { date: "2025-03-26", GreenAPI: 3, YellowAPI: 7, RedAPI: 24 },
      { date: "2025-03-27", GreenAPI: 7, YellowAPI: 13, RedAPI: 10 },
      { date: "2025-03-28", GreenAPI: 1, YellowAPI: 11, RedAPI: 15 },
      { date: "2025-03-29", GreenAPI: 1, YellowAPI: 15, RedAPI: 25 },
      { date: "2025-03-30", GreenAPI: 0, YellowAPI: 13, RedAPI: 18 },
      { date: "2025-03-31", GreenAPI: 0, YellowAPI: 11, RedAPI: 23 },
      { date: "2025-04-01", GreenAPI: 3, YellowAPI: 7, RedAPI: 24 },
      { date: "2025-04-02", GreenAPI: 2, YellowAPI: 6, RedAPI: 11 },
      { date: "2025-04-03", GreenAPI: 4, YellowAPI: 13, RedAPI: 23 },
      { date: "2025-04-04", GreenAPI: 1, YellowAPI: 8, RedAPI: 21 },
      { date: "2025-04-05", GreenAPI: 7, YellowAPI: 8, RedAPI: 16 },
      { date: "2025-04-06", GreenAPI: 4, YellowAPI: 11, RedAPI: 16 },
      { date: "2025-04-07", GreenAPI: 3, YellowAPI: 9, RedAPI: 13 },
      { date: "2025-04-08", GreenAPI: 3, YellowAPI: 12, RedAPI: 16 },
    ];

    return chartData;
  }),
});
