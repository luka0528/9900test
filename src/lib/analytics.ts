import { db } from "~/server/db";

export const getRatingForService = async (serviceId: string) => {
  const ratings = await db.serviceRating.findMany({
    where: {
      serviceId: serviceId,
    },
    select: {
      starValue: true,
    },
  });

  const sum = ratings.reduce((acc, rating) => acc + rating.starValue, 0);
  const avg = ratings.length > 0 ? sum / ratings.length : 0;
  return avg;
};

export const getRevenueTotalForUser = async (userId: string) => {
  const serviceIds = await db.service.findMany({
    where: {
      owners: {
        some: {
          id: userId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  const revenues = await Promise.all(
    serviceIds.map((service) => getRevenueTotalForService(service.id)),
  );

  const sum = revenues.reduce((acc, rev) => acc + rev, 0);
  return sum;
};

export const getRevenueTotalForService = async (serviceId: string) => {
  const receipts = await db.billingReceipt.findMany({
    where: {
      subscriptionTier: {
        serviceId: serviceId,
      },
      status: "PAID",
    },
    select: {
      amount: true,
    },
  });

  const sum = receipts.reduce((acc, receipt) => acc + receipt.amount, 0);
  return sum;
};

export const getRevenueMonthlyForService = async (serviceId: string) => {
  const today = new Date();
  const receipts = await db.billingReceipt.findMany({
    where: {
      subscriptionTier: {
        serviceId: serviceId,
      },
      status: "PAID",
      date: {
        gte: new Date(today.getFullYear(), today.getMonth(), 1),
      },
    },
    select: {
      amount: true,
    },
  });

  const sum = receipts.reduce((acc, receipt) => acc + receipt.amount, 0);
  return sum;
};
