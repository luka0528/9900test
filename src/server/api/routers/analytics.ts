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
          toId: ctx.session.user.id,
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

  getNumCustomersPerServiceTier: protectedProcedure.query(async ({ ctx }) => {
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
  
    type SubscriptionTierInfo = {
      tierName: string;
      price: number;
      customerCount: number;
    }

    const serviceToTiers = new Map<string, Array<SubscriptionTierInfo>>();
  
    services.forEach((service) => {
      const tiers = service.subscriptionTiers.map(tier => ({
        tierName: tier.name,
        price: tier.price,
        customerCount: tier.consumers.length
      }));
  
      serviceToTiers.set(service.name, tiers);
    });
  
    // return serviceToTiers;

    // Dummy data for testing
    const dummyData = new Map<string, Array<SubscriptionTierInfo>>();
    dummyData.set("Service A", [
      { tierName: "Basic", price: 10, customerCount: 100 },
      { tierName: "Pro", price: 20, customerCount: 10 },
      { tierName: "Enterprise", price: 30, customerCount: 25 },
    ]);
    dummyData.set("Service B", [
      { tierName: "Basic", price: 15, customerCount: 5 },
      { tierName: "Pro", price: 25, customerCount: 3 },
      { tierName: "Enterprise", price: 35, customerCount: 2 },
    ]);

    return dummyData;
  })
});
