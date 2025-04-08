import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { RestMethod } from "@prisma/client";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { BillingStatus } from "@prisma/client";

// make a max float string
const MAX_FLOAT = "3.4028235e+38";
export const serviceRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        version: z.string().min(1),
        description: z.string().min(1),
        tags: z.array(z.string()).default([]),
        subscriptionTiers: z.array(
          z.object({
            name: z.string().min(1),
            price: z.number().min(0),
            features: z.array(z.string()).default([]),
          }),
        ),
        contents: z.array(
          z.object({
            title: z.string().min(1),
            description: z.string().min(1),
            rows: z.array(
              z.object({
                routeName: z.string().min(1),
                description: z.string().min(1),
                method: z.nativeEnum(RestMethod),
              }),
            ),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create a service",
        });
      }

      const service = await ctx.db.service.create({
        data: {
          name: input.name,
          tags: {
            connectOrCreate: input.tags.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
          subscriptionTiers: {
            create: input.subscriptionTiers.map((tier) => ({
              name: tier.name,
              price: tier.price,
              features: {
                create: tier.features.map((feature) => ({
                  feature,
                })),
              },
            })),
          },
          owners: {
            create: {
              user: {
                connect: {
                  id: ctx.session.user.id,
                },
              },
            },
          },
          versions: {
            create: {
              version: input.version,
              description: input.description,
              contents: {
                create: input.contents.map((content) => ({
                  title: content.title,
                  description: content.description,
                  rows: {
                    create: content.rows.map((row) => ({
                      method: row.method,
                      routeName: row.routeName,
                      description: row.description,
                    })),
                  },
                })),
              },
            },
          },
        },
        include: {
          versions: true,
        },
      });

      if (!service.versions || service.versions.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Service version was not created properly",
        });
      }

      const firstVersion = service.versions[0];

      if (!firstVersion || typeof firstVersion.id !== "string") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Service version ID is invalid",
        });
      }

      return {
        serviceId: service.id,
        versionId: firstVersion.id,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ serviceId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const service = await ctx.db.service.findUnique({
        where: {
          id: input.serviceId,
          owners: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      // Check that the service exists and that the userId is in the owners list
      if (!service) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      // Delete the service from the services table
      await ctx.db.service.delete({
        where: { id: service.id },
      });

      // TODO for future ticket: finally, notify all subscribers that this service is scheduled to be deleted

      return { success: true };
    }),

  updateServiceMetadata: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().min(1),
        newName: z.string().min(1),
        subscriptionTiers: z.array(
          z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            price: z.number().min(0),
            features: z.array(z.string()).default([]),
          }),
        ),
        tags: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = await ctx.db.service.findUnique({
        where: { id: input.serviceId },
        include: {
          owners: true,
        },
      });

      if (!service) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      if (
        service.owners.some((owner) => owner.userId !== ctx.session.user.id)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this service",
        });
      }

      await ctx.db.service.update({
        where: { id: input.serviceId },
        data: {
          name: input.newName,
          subscriptionTiers: {
            deleteMany: {
              id: {
                notIn: input.subscriptionTiers
                  .filter((tier) => tier.id)
                  .map((tier) => tier.id),
              },
            },
            upsert: input.subscriptionTiers.map((tier) => ({
              where: {
                id: tier.id ?? "",
              },
              create: {
                name: tier.name,
                price: tier.price,
                features: {
                  create: tier.features.map((feature) => ({
                    feature,
                  })),
                },
              },
              update: {
                name: tier.name,
                price: tier.price,
                features: {
                  deleteMany: {},
                  create: tier.features.map((feature) => ({
                    feature,
                  })),
                },
              },
            })),
          },
          tags: {
            disconnect: input.tags
              ? await ctx.db.tag.findMany({
                  where: {
                    services: { some: { id: input.serviceId } },
                    name: { notIn: input.tags },
                  },
                  select: { id: true },
                })
              : [],
            connectOrCreate: input.tags.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
        },
      });

      return { success: true };
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const services = await ctx.db.service.findMany();
    return services;
  }),

  getAllByUserId: protectedProcedure.query(async ({ ctx }) => {
    const services = await ctx.db.service.findMany({
      where: {
        owners: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
      include: {
        tags: true,
        versions: {
          orderBy: {
            version: "desc",
          },
        },
      },
    });

    const res = services.map((service) => ({
      id: service.id,
      name: service.name,
      owner: ctx.session.user.name,
      tags: service.tags.map((tag) => tag.name),
      latestVersion: service.versions[0]!,
    }));

    return res;
  }),

  editName: protectedProcedure
    .input(
      z.object({ serviceId: z.string().min(1), newName: z.string().min(1) }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check that user owns this service
      const service = await ctx.db.service.findUnique({
        where: {
          id: input.serviceId,
          owners: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!service) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      // Edit the name
      await ctx.db.service.update({
        where: {
          id: input.serviceId,
        },
        data: {
          name: input.newName,
        },
      });

      return { success: true };
    }),

  getServiceMetadataById: publicProcedure
    .input(z.object({ serviceId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const service = await ctx.db.service.findUnique({
        where: { id: input.serviceId },
        select: {
          name: true,
          tags: true,
          versions: {
            select: {
              version: true,
              id: true,
              description: true,
            },
            orderBy: {
              version: "desc",
            },
          },
          subscriptionTiers: {
            select: {
              id: true,
              name: true,
              price: true,
              features: {
                select: { feature: true },
              },
            },
          },
          owners: {
            select: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (!service) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      return service;
    }),

  getServiceById: publicProcedure
    .input(z.string().min(1))
    .query(async ({ ctx, input }) => {
      const service = await ctx.db.service.findUnique({
        where: {
          id: input,
        },
        include: {
          tags: true,
          versions: {
            include: {
              contents: {
                include: {
                  rows: true,
                },
              },
            },
            orderBy: {
              version: "desc",
            },
          },
          owners: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          ratings: {
            select: {
              consumer: {
                select: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              comments: true,
              starValue: true,
              content: true,
              createdAt: true,
            },
          },
        },
      });

      if (!service) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      return service;
    }),

  addTag: protectedProcedure
    .input(z.object({ serviceId: z.string().min(1), tag: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const serviceValid = await ctx.db.service.findUnique({
        where: {
          id: input.serviceId,
          owners: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          tags: true,
        },
      });

      // Ensure that the userId is an owner of the service
      if (!serviceValid) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      // If the service has 10 or more tags, return early
      if (serviceValid.tags.length >= 10) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This service has reached the maximum number of tags",
        });
      }

      // Otherwise, convert the tag to fully lowercase
      const tagName = input.tag.toLowerCase();

      await ctx.db.service.update({
        where: {
          id: input.serviceId,
        },
        data: {
          tags: {
            connectOrCreate: {
              where: { name: tagName },
              create: { name: tagName },
            },
          },
        },
      });

      return { success: true };
    }),

  deleteTag: protectedProcedure
    .input(z.object({ serviceId: z.string().min(1), tag: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const service = await ctx.db.service.findUnique({
        where: {
          id: input.serviceId,
          owners: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          tags: true,
        },
      });

      // Ensure that the userId is an owner of the service
      if (!service) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      // Check that the tag is in the service
      const toDelete = input.tag.toLowerCase();
      const tag = await ctx.db.tag.findUnique({
        where: {
          name: toDelete,
          services: {
            some: {
              id: input.serviceId,
            },
          },
        },
        include: {
          services: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!tag) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tag not found",
        });
      }

      // Tag only belongs to this service, so delete it
      if (tag.services.length == 1) {
        await ctx.db.tag.delete({
          where: {
            name: toDelete,
          },
        });
      } else {
        // Otherwise, just disconnect it
        await ctx.db.service.update({
          where: {
            id: input.serviceId,
          },
          data: {
            tags: {
              disconnect: {
                id: tag.id,
              },
            },
          },
        });
      }
      return { success: true };
    }),

    getServiceByQuery: publicProcedure
    .input(
      z.object({
        search: z.string().nullish(),
        tags: z.union([z.array(z.string()), z.string()]).nullish(),
        sort: z.string().nullish(),
        price: z.array(z.string()).nullish(),
        dates: z.union([z.array(z.string()), z.string()]).nullish(),
        cursor: z.string().nullish(),
        limit: z.number().default(12),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { search, tags, sort, price, dates, cursor, limit } = input;
      const processTags = tags ? (Array.isArray(tags) ? tags : [tags]) : [];
      const processDates = dates
        ? Array.isArray(dates)
          ? dates
          : [dates]
        : [];
  
      // Define the order by logic based on sort parameter
      let orderBy: Prisma.ServiceOrderByWithRelationInput = {
        consumerEvents: {
          _count: "desc",
        },
      };
  
      // Define sorting based on the lowest subscription tier price
      if (sort === "Price-Desc") {
        orderBy = {
          subscriptionTiers: {
            _min: {
              price: "desc",
            },
          },
        } as Prisma.ServiceOrderByWithRelationInput;
      } else if (sort === "Price-Asc") {
        orderBy = {
          subscriptionTiers: {
            _min: {
              price: "asc",
            },
          },
        } as Prisma.ServiceOrderByWithRelationInput;
      } else if (sort === "New-to-Old") {
        orderBy = {
          createdAt: "desc",
        } as Prisma.ServiceOrderByWithRelationInput;
      } else if (sort === "Old-to-New") {
        orderBy = {
          createdAt: "asc",
        } as Prisma.ServiceOrderByWithRelationInput;
      } else if (sort === "Last-Updated") {
        orderBy = {
          updatedAt: "desc",
        } as Prisma.ServiceOrderByWithRelationInput;
      } else if (sort === "Name-Asc") {
        orderBy = { name: "asc" } as Prisma.ServiceOrderByWithRelationInput;
      } else if (sort === "Name-Desc") {
        orderBy = { name: "desc" } as Prisma.ServiceOrderByWithRelationInput;
      }
  
      // Date filtering logic
      let dateFilter: Prisma.ServiceWhereInput = {};
      if (dates && dates.length > 0) {
        const dateConditions = processDates.map((yearStr) => {
          const year = parseInt(yearStr);
          // Utilising UTC to avoid timezone issues - need to implement service wide
          const startDate = new Date(`${year}-01-01T00:00:00Z`);
          const endDate = new Date(`${year + 1}-01-01T00:00:00Z`);
          return {
            createdAt: {
              gte: startDate,
              lt: endDate,
            },
          };
        });
        dateFilter = {
          OR: dateConditions,
        };
      }
  
      // Build the where clause
      const whereClause: Prisma.ServiceWhereInput = {
        ...(search && {
          name: {
            contains: search || "",
            mode: "insensitive",
          },
        }),
        ...(tags &&
          tags.length > 0 && {
            tags: {
              some: {
                name: {
                  in: processTags,
                },
              },
            },
          }),
        ...dateFilter,
      };
  
      // Handle price range filtering by looking at the minimum subscription tier price
      if (price && price.length === 2) {
        const minPrice = parseFloat(price[0] ?? "0");
        const maxPrice = parseFloat(price[1] ?? MAX_FLOAT);
  
        // First, get IDs of services that have at least one subscription tier within the price range
        const servicesWithinPriceRange = await ctx.db.service.findMany({
          where: {
            subscriptionTiers: {
              some: {
                price: {
                  gte: minPrice,
                  lte: maxPrice,
                },
              },
            },
          },
          select: {
            id: true,
            subscriptionTiers: {
              select: {
                price: true,
              },
              orderBy: {
                price: "asc",
              },
            },
          },
        });
  
        // Filter services that have their lowest subscription tier within the price range
        const serviceIdsWithLowestTierInRange = servicesWithinPriceRange
          .filter(service => 
            service.subscriptionTiers.length > 0 && 
            service.subscriptionTiers[0] && 
            service.subscriptionTiers[0].price >= minPrice && 
            service.subscriptionTiers[0].price <= maxPrice
          )
          .map(service => service.id);
  
        // Add this to the where clause
        whereClause.id = {
          in: serviceIdsWithLowestTierInRange,
        };
      }
  
      // Query services with the where clause and order by
      const services = await ctx.db.service.findMany({
        where: whereClause,
        orderBy: orderBy,
        include: {
          subscriptionTiers: {
            orderBy: {
              price: "asc",
            },
            take: 1,
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          versions: {
            orderBy: {
              version: "desc",
            },
            take: 1,
            select: {
              id: true,
              version: true,
              description: true,
            },
          },
          owners: {
            take: 1,
            select: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          tags: {
            take: 4,
            select: {
              name: true,
            },
          },
        },
        cursor: cursor ? { id: cursor } : undefined,
        take: limit + 1, // Take one extra to determine if there's a next page
      });
  
      const nextCursor = services.length > limit ? services.pop()?.id : null;
      return { services, nextCursor };
    }),
  /* ~~~~~~~~~ TODO: COMPLETE FUNCTIONALITY ~~~~~~~~~ */
  /* ~~~~~~~~~ TODO: COMPLETE FUNCTIONALITY ~~~~~~~~~ */
  /* ~~~~~~~~~ TODO: COMPLETE FUNCTIONALITY ~~~~~~~~~ */
  subscribeToTier: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        newTierId: z.string(),
        currentTierId: z.string().optional(), // used if changing tiers
        paymentMethodId: z.string().optional(),
        autoRenewal: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        serviceId,
        newTierId,
        currentTierId,
        paymentMethodId,
        autoRenewal,
      } = input;

      // 1. Validate the service
      const service = await ctx.db.service.findUnique({
        where: { id: serviceId },
        include: {
          subscriptionTiers: true,
          owners: true,
        },
      });
      if (!service) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      // 2. Validate the new tier
      const newTier = await ctx.db.subscriptionTier.findUnique({
        where: { id: newTierId },
      });
      if (!newTier || newTier.serviceId !== service.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid tier for this service",
        });
      }

      // 3. If currentTierId is provided, remove (or update) the old subscription
      if (currentTierId) {
        if (currentTierId === newTier.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot subscribe to the same tier",
          });
        }
        // Find the existing subscription to the current tier
        const oldSubscription = await ctx.db.serviceConsumer.findFirst({
          where: {
            userId: ctx.session.user.id,
            subscriptionTierId: currentTierId,
          },
        });
        if (!oldSubscription) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No existing subscription found for currentTierId",
          });
        }
        // Update the existing subscription to the new tier
        await ctx.db.serviceConsumer.update({
          where: { id: oldSubscription.id },
          data: { subscriptionTierId: newTier.id, lastRenewed: new Date() },
        });
      } else {
        // className={`rounded-md p-5 text-left shadow-inner ${isCurrent ? "bg-gray-300" : "bg-gray-50"}`}
        // check if user is already subscribed to the new tier
        const existingSubscriptionToNewTier =
          await ctx.db.serviceConsumer.findFirst({
            where: {
              userId: ctx.session.user.id,
              subscriptionTierId: newTier.id,
            },
          });
        if (existingSubscriptionToNewTier) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User already subscribed to the new tier",
          });
        }
        // Create a new subscription to the new tier
        await ctx.db.serviceConsumer.create({
          data: {
            userId: ctx.session.user.id,
            subscriptionTierId: newTier.id,
            renewingSubscription: autoRenewal,
            paymentMethodId: paymentMethodId,
          },
        });
      }

      // 5. Hhandle payment logic
      if (paymentMethodId) {
        // a) Verify the payment method belongs to the user
        const paymentMethod = await ctx.db.paymentMethod.findUnique({
          where: { id: paymentMethodId },
        });
        if (!paymentMethod || paymentMethod.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Payment method not found or doesn't belong to user",
          });
        }

        // b) TODO: Call Stripe

        // c) Create a billing receipt
        await ctx.db.billingReceipt.create({
          data: {
            amount: newTier.price,
            description: `Subscription to ${newTier.name}`,
            fromId: service.owners[0]?.id ?? "",
            toId: ctx.session.user.name ?? "",
            status: BillingStatus.PAID,
            paymentMethodId: paymentMethod.id,
            subscriptionTierId: newTier.id,
          },
        });
      }

      return { success: true };
    }),

  /* ~~~~~~~~~ TODO: COMPLETE FUNCTIONALITY ~~~~~~~~~ */
  /* ~~~~~~~~~ TODO: COMPLETE FUNCTIONALITY ~~~~~~~~~ */
  /* ~~~~~~~~~ TODO: COMPLETE FUNCTIONALITY ~~~~~~~~~ */
  updateSubscriptionPaymentMethod: protectedProcedure
    .input(
      z.object({
        subscriptionTierId: z.string(), // which tier the user is subscribed to
        paymentMethodId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { subscriptionTierId, paymentMethodId } = input;

      // 1) Find the user's subscription
      const subscription = await ctx.db.serviceConsumer.findFirst({
        where: {
          userId: ctx.session.user.id,
          subscriptionTierId: subscriptionTierId,
        },
      });
      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found for the given tier",
        });
      }

      // 2) Validate payment method
      const paymentMethod = await ctx.db.paymentMethod.findUnique({
        where: { id: paymentMethodId },
      });
      if (!paymentMethod || paymentMethod.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Payment method not found or doesn't belong to user",
        });
      }

      // 3) (Optional) Handle additional logic (e.g. update auto-renew, create a billing receipt, etc.)

      // 4) Update the subscription with the new payment method
      // NOTE: This requires that your ServiceConsumer model has a field for paymentMethodId.
      // If not, you'll need to add it in your Prisma schema.
      await ctx.db.serviceConsumer.update({
        where: { id: subscription.id, subscriptionTierId: subscriptionTierId },
        data: { paymentMethodId: paymentMethod.id },
      });

      return { success: true };
    }),
  /* ~~~~~~~~~ TODO: COMPLETE FUNCTIONALITY ~~~~~~~~~ */
  /* ~~~~~~~~~ TODO: COMPLETE FUNCTIONALITY ~~~~~~~~~ */
  /* ~~~~~~~~~ TODO: COMPLETE FUNCTIONALITY ~~~~~~~~~ */
  unsubscribeToTier: protectedProcedure
    .input(
      z.object({
        subscriptionTierId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { subscriptionTierId } = input;

      // 1) Find the subscription
      const subscription = await ctx.db.serviceConsumer.findFirst({
        where: {
          userId: ctx.session.user.id,
          subscriptionTierId,
        },
      });
      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found",
        });
      }

      // 2) Delete the subscription record
      await ctx.db.serviceConsumer.delete({
        where: { id: subscription.id },
      });

      // (Optional) If you want to record a final BillingReceipt or mark something in your logs, do so here.

      return { success: true };
    }),

  getAllVersionChangelogs: publicProcedure
    .input(z.object({ serviceId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const service = await ctx.db.service.findUnique({
        where: { id: input.serviceId },
        select: {
          name: true,
          versions: {
            select: {
              changelogPoints: true,
              version: true,
            },
            orderBy: {
              version: "desc",
            },
          },
        },
      });

      return service;
    }),

  getRelatedServices: publicProcedure
    .input(
      z.object({
        currentServiceId: z.string(),
        tags: z.array(z.string()).default([]),
        limit: z.number().default(6),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { currentServiceId, tags, limit } = input;

      if (tags.length === 0) {
        return {
          relatedServices: [],
          foundRelated: false,
          message:
            "Cannot find similar services due to current service having no tags",
        };
      }

      const services = await ctx.db.service.findMany({
        where: {
          id: {
            not: currentServiceId,
          },
          tags: {
            some: {
              name: {
                in: tags,
              },
            },
          },
        },
        include: {
          versions: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
          owners: {
            include: {
              user: true,
            },
          },
          tags: true,
        },
        take: limit,
        orderBy: {
          updatedAt: "desc",
        },
      });

      return {
        relatedServices: services,
        foundRelated: services.length > 0,
        message:
          services.length > 0
            ? "Found related services"
            : "No related services found",
      };
    }),
});
