import { z } from "zod";
import {
  getCustomersForService,
  getRatingForUser,
  getRevenueOverTimeByService,
  getRevenueTotalForUser,
  getServicesByUser,
  getSubscriptionTiersByService,
  getRecentCommentsByUser,
  getRevenueMonthlyForUser,
} from "~/lib/analytics";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const analyticsRouter = createTRPCRouter({
  getTotalRevenueOfUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return await getRevenueTotalForUser(userId);
  }),

  getMonthlyRevenueOfUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return await getRevenueMonthlyForUser(userId);
  }),
  
  getAverageRating: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return await getRatingForUser(userId);
  }),

  getNumCustomersPerService: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const services = await getServicesByUser(userId);

    const serviceToCustomer = await Promise.all(
      services.map(async (service) => ({
        serviceName: service.name,
        customerCount: await getCustomersForService(service.id),
      })),
    );

    return serviceToCustomer;
  }),

  getMostPopularService: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const services = await getServicesByUser(userId);

    console.log("🤩 Services: ", services);
    const serviceToCustomer = await Promise.all(
      services.map(async (service) => ({
        serviceName: service.name,
        customerCount: await getCustomersForService(service.id),
      })),
    );

    const mostPopularService = serviceToCustomer.reduce((prev, current) => {
      return prev.customerCount > current.customerCount ? prev : current;
    });

    return mostPopularService;
  }),

  getTotalCustomers: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const services = await getServicesByUser(userId);

    const customerCount = await Promise.all(
      services.map(async (service) => await getCustomersForService(service.id)),
    );

    const sum = customerCount.reduce((sum, count) => sum + count, 0);
    return sum;
  }),

  getNumCustomersPerServiceTier: protectedProcedure
    .input(z.object({ service: z.string() }))
    .query(async ({ input }) => {
      const { service } = input;

      const subscriptionTiers = await getSubscriptionTiersByService(service);

      const tierBreakdown = subscriptionTiers.map((tier) => {
        const customerCount = tier.consumers.length;
        return {
          tierName: tier.name,
          price: tier.price,
          customerCount,
        };
      });

      return tierBreakdown;
    }),

  getRevenueGraphByUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const services = await getServicesByUser(userId);

    // Create a mapping of service-name to the revenue per day (date-to-amount).
    const serviceRevenue = await Promise.all(
      services.map(async (service) => {
        const revenue = await getRevenueOverTimeByService(service.id);

        const revenuePerDay = revenue.reduce(
          (acc, receipt) => {
            const date = receipt.date.toISOString().split("T")[0]!;
            acc[date] = (acc[date] ?? 0) + receipt.amount;
            return acc;
          },
          {} as Record<string, number>,
        );
        return {
          serviceName: service.name,
          revenuePerDay,
        };
      }),
    );

    // Create a list of ChartData, with objects in the format:
    // { date: "YYYY-MM-DD", serviceName1: amount, serviceName2: amount, ... }
    // Prefilling the amount with 0 if necessary.
    const revenueOverTime = [];
    const today = new Date();
    const tomorrow = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );

    const currDate = new Date(
      today.getFullYear() - 1,
      today.getMonth(),
      today.getDay(),
    );
    while (currDate <= tomorrow) {
      const date = currDate.toISOString().split("T")[0]!;

      const dataPoint = {
        date,
        ...Object.fromEntries(
          serviceRevenue.map((service) => [
            service.serviceName,
            service.revenuePerDay[date] ?? 0,
          ]),
        ),
      };

      revenueOverTime.push(dataPoint);
      currDate.setDate(currDate.getDate() + 1);
    }

    return revenueOverTime;
  }),

  getServicesByUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const services = await getServicesByUser(userId);
    return services;
  }),

  getRecentCommentsByUser: protectedProcedure
    .input(z.object({ n: z.number() }))
    .query(async ({ ctx, input }) => {
      const { n } = input;
      const userId = ctx.session.user.id;
      const comments = await getRecentCommentsByUser(userId, n);

      return comments;
    }),
});
