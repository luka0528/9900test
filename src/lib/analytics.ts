import { db } from "~/server/db";

export const getServicesByUser = async (userId: string) => {
  const services = await db.serviceOwner.findMany({
    where: {
      userId: userId,
    },
    select: {
      service: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return services.map((service) => service.service);
};

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

export const getRatingForUser = async (userId: string) => {
  const ratings = await db.service.findMany({
    where: {
      owners: {
        some: {
          userId: userId,
        },
      },
    },
    select: {
      ratings: {
        select: {
          starValue: true,
        },
      },
    },
  });

  console.log("😻 Ratings: ", ratings);

  const allRatings = ratings.flatMap((service) =>
    service.ratings.map((rating) => rating.starValue),
  );

  console.log("😻 All Ratings: ", allRatings);

  const sum = allRatings.reduce((acc, rating) => acc + rating, 0);
  const avg = allRatings.length > 0 ? sum / allRatings.length : 0;
  return avg;
};

export const getRevenueTotalForUser = async (userId: string) => {
  const serviceIds = await db.service.findMany({
    where: {
      owners: {
        some: {
          userId: userId,
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

export const getRevenueMonthlyForUser = async (userId: string) => {
  const serviceIds = await db.service.findMany({
    where: {
      owners: {
        some: {
          userId: userId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  const revenues = await Promise.all(
    serviceIds.map((service) => getRevenueMonthlyForService(service.id)),
  );

  const sum = revenues.reduce((acc, rev) => acc + rev, 0);
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

export const getCustomersForService = async (serviceId: string) => {
  const customers = await db.service.findMany({
    where: {
      id: serviceId,
    },
    select: {
      subscriptionTiers: {
        select: {
          consumers: {
            where: {
              OR: [
                { subscriptionStatus: "ACTIVE" },
                { subscriptionStatus: "PENDING_CANCELLATION" },
              ],
            },
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  const numCustomers = customers.flatMap((service) => {
    return service.subscriptionTiers.flatMap((tier) =>
      tier.consumers.map((consumer) => consumer.id),
    );
  });

  return numCustomers.length;
};

export const getSubscriptionTiersByService = async (serviceId: string) => {
  const subscriptionTiers = await db.subscriptionTier.findMany({
    where: {
      serviceId: serviceId,
    },
    select: {
      id: true,
      name: true,
      price: true,
      consumers: {
        select: {
          id: true,
        },
      },
    },
  });

  return subscriptionTiers;
};

export const getRevenueOverTimeByService = async (serviceId: string) => {
  const receipts = await db.billingReceipt.findMany({
    where: {
      subscriptionTier: {
        serviceId: serviceId,
      },
      status: "PAID",
    },
    orderBy: {
      date: "asc",
    },
    select: {
      date: true,
      amount: true,
    },
  });

  return receipts;
};

export const getRecentCommentsByUser = async (userId: string, n: number) => {
  const comments = await db.serviceRating.findMany({
    where: {
      service: {
        owners: {
          some: {
            userId: userId,
          },
        },
      },
    },
    take: n,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      content: true,
      starValue: true,
      createdAt: true,
      service: {
        select: {
          id: true,
          name: true,
        },
      },
      consumer: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  return comments;
};
