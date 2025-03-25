import { TRPCError } from "@trpc/server";
import type { Prisma, Service } from "@prisma/client";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import type { Query } from "~/components/marketplace/MarketplaceQuery";
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
        contents: z.array(
          z.object({
            title: z.string().min(1),
            description: z.string().min(1),
            rows: z.array(
              z.object({
                routeName: z.string().min(1),
                description: z.string().min(1),
              }),
            ),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = await ctx.db.service.create({
        data: {
          name: input.name,
          tags: {
            connectOrCreate: input.tags.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
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

      return {
        serviceId: service.id,
        versionId: service.versions[0]!.id,
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

  getInfiniteServices: publicProcedure
    .input(
      z.object({
        query: z.custom<Query>(),
        cursor: z.number().nullish(),
      }),
    )
    .query(async ({ input }) => {
      const cursor = input.cursor ?? 0;
      const limit = 12;

      // Generates fake services as mock data.
      const services: Service[] = Array.from({ length: limit }, (_, i) => {
        const id = cursor + i;
        return {
          id: id.toString(),
          name: `Service ${id}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      const nextCursor = services.length ? cursor + limit : null;

      return { services, nextCursor };
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
        versions: true,
      },
    });

    const res = services.map((service) => ({
      id: service.id,
      name: service.name,
      owner: ctx.session.user.name,
      tags: service.tags.map((tag) => tag.name),
      latestVersion: service.versions[service.versions.length - 1]!,
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
              description: true,
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
          subscriptionTiers: true,
          tags: true,
          versions: {
            include: {
              contents: {
                include: {
                  rows: true,
                },
              },
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
      console.log(processTags);
      let orderBy: Prisma.ServiceOrderByWithRelationInput = {
        consumerEvents: {
          _count: "desc",
        },
      };
      if (sort == "Price-Desc") {
        orderBy = {
          subscriptionTiers: {
            price: "desc",
          },
        } as Prisma.ServiceOrderByWithRelationInput;
      } else if (sort == "Price-Asc") {
        orderBy = {
          subscriptionTiers: {
            price: "asc",
          },
        } as Prisma.ServiceOrderByWithRelationInput;
        orderBy = {
          createdAt: "asc",
        } as Prisma.ServiceOrderByWithRelationInput;
      } else if (sort == "Old-to-New") {
        orderBy = {
          createdAt: "desc",
        } as Prisma.ServiceOrderByWithRelationInput;
      } else if (sort == "Last-Updated") {
        orderBy = {
          updatedAt: "desc",
        } as Prisma.ServiceOrderByWithRelationInput;
      } else if (sort == "Name-Asc") {
        orderBy = { name: "asc" } as Prisma.ServiceOrderByWithRelationInput;
      } else if (sort == "Name-Desc") {
        orderBy = { name: "desc" } as Prisma.ServiceOrderByWithRelationInput;
      }

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
        ...(price &&
          price.length == 2 && {
            price: {
              gte: parseFloat(price[0] ?? "0"),
              lte: parseFloat(price[1] ?? MAX_FLOAT),
            },
          }),
        ...dateFilter,
      };

      const services = await ctx.db.service.findMany({
        where: whereClause,
        orderBy: orderBy,
        include: {
          versions: {
            orderBy: {
              version: "desc",
            },
            take: 1,
            select: {
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
        take: limit,
      });

      console.log(services);

      const nextCursor = services.length > limit ? services.pop()?.id : null;
      return { services, nextCursor };
    }),

  subscribeToTier: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        tierId: z.string(),
        paymentMethodId: z.string().optional(),
        autoRenewal: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { serviceId, tierId, paymentMethodId, autoRenewal } = input;

      // 1. Validate the service
      const service = await ctx.db.service.findUnique({
        where: { id: serviceId },
        include: {
          subscriptionTiers: true,
        },
      });
      if (!service) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      // 2. Validate the tier
      const tier = await ctx.db.subscriptionTier.findUnique({
        where: { id: tierId },
      });
      if (!tier || tier.serviceId !== service.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid tier" });
      }

      // 3. Check if user is already subscribed
      //    e.g., find an existing ServiceConsumer record for this user + service
      const existingSubscription = await ctx.db.serviceConsumer.findFirst({
        where: {
          userId: ctx.session.user.id,
          subscriptionTier: {
            serviceId: serviceId,
          },
        },
      });

      if (existingSubscription) {
        // Option A: Throw an error if the user is already subscribed to any tier of this service
        // throw new TRPCError({
        //   code: "CONFLICT",
        //   message: "User already subscribed to this service",
        // });

        // Option B: Update the existing subscription to the new tier
        await ctx.db.serviceConsumer.update({
          where: { id: existingSubscription.id },
          data: {
            subscriptionTierId: tier.id,
          },
        });
      } else {
        // 4. Create a new subscription record
        await ctx.db.serviceConsumer.create({
          data: {
            userId: ctx.session.user.id,
            subscriptionTierId: tier.id,
          },
        });
      }

      // 5. If a paymentMethodId is provided, handle payment/charge logic
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

        // b) (Optional) Actually charge the user with Stripe here if you want a real charge
        //    e.g., stripe.paymentIntents.create(...) or something similar
        //    For demonstration, we'll skip that and just create a billing receipt.

        await ctx.db.billingReceipt.create({
          data: {
            userId: ctx.session.user.id,
            paymentMethodId: paymentMethod.id,
            amount: tier.price,
            description: `Subscription to ${tier.name}`,
            from: service.name,
            to: ctx.session.user.name ?? "", // or something
            status: BillingStatus.PAID, // or PENDING if you want to finalize later
            automaticRenewal: autoRenewal, // set to true if you plan to auto-renew
          },
        });
      }

      return { success: true };
    }),
});
