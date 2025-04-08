import { TRPCError } from "@trpc/server";
import type { Prisma, Service } from "@prisma/client";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import type { Query } from "~/components/marketplace/MarketplaceQuery";
import { content } from "tailwindcss/defaultTheme";

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
              consumers: {
                select: {
                  userId: true,
                },
              },
              name: true,
              price: true,
              features: {
                select: { feature: true },
              },
            },
          },
          ratings: {
            select: {
              id: true,
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
              starValue: true,
              content: true,
              createdAt: true,
              comments: {
                select: {
                  id: true,
                  owner: {
                    select: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                  content: true,
                  createdAt: true,
                },
                orderBy: {
                  createdAt: "desc",
                },
              },
            },
            orderBy: {
              createdAt: "desc",
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
      let orderBy: Prisma.ServiceOrderByWithRelationInput = {
        consumerEvents: {
          _count: "desc",
        },
      };
      // @Utsav TODO: Given the new pricing structure, we need to update this to account for all subscription tiers
      if (sort == "Price-Desc") {
        orderBy = {
          subscriptionTiers: {
            price: "desc",
          },
        } as Prisma.ServiceOrderByWithRelationInput;
        // @Utsav TODO: Given the new pricing structure, we need to update this to account for all subscription tiers
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
        // @Utsav TODO: Given the new pricing structure, we need to update this to account for all subscription tiers
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

      const nextCursor = services.length > limit ? services.pop()?.id : null;
      return { services, nextCursor };
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

  createReview: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().min(1),
        content: z.string(),
        starValue: z.number().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user is subscribed to this service and hasn't reviewed it already
      const service = await ctx.db.service.findUnique({
        where: { id: input.serviceId },
        select: {
          subscriptionTiers: {
            where: {
              consumers: {
                some: {
                  userId: ctx.session.user.id,
                },
              },
            },
          },
          ratings: {
            where: {
              consumer: {
                userId: ctx.session.user.id,
              },
            },
          },
          owners: {
            where: {
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

      // These errors should never occur (due to frontend verifying this already) (todo - uncomment)
      // if (service.owners.length >= 1) {
      //   throw new TRPCError({
      //     code: "UNAUTHORIZED",
      //     message: "You cannot review your own service",
      //   });
      // }
      if (service.subscriptionTiers.length == 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You cannot review a service that you are not subscribed to",
        });
      }

      // Already reviewed
      if (service.ratings.length >= 1) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You have already posted a review",
        });
      }

      // Find the consumerId
      const consumer = await ctx.db.serviceConsumer.findFirst({
        select: {
          id: true,
        },
        where: {
          userId: ctx.session.user.id,
          subscriptionTier: {
            serviceId: input.serviceId,
          },
        },
      });

      if (!consumer) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not a service consumer",
        });
      }

      // Post the review
      const rating = await ctx.db.serviceRating.create({
        data: {
          starValue: input.starValue,
          content: input.content,
          serviceId: input.serviceId,
          consumerId: consumer.id,
        },
      });

      return {
        reviewerId: ctx.session.user.id,
        reviewername: ctx.session.user.name,
        ...rating,
      };
    }),

  createReviewReply: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().min(1),
        reviewId: z.string().min(1),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check that the current user owns the service (and get their ownerId)
      const owner = await ctx.db.serviceOwner.findFirst({
        where: {
          userId: ctx.session.user.id,
          serviceId: input.serviceId,
        },
        select: {
          id: true,
        },
      });

      if (!owner) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not a service owner",
        });
      }

      // Create the reply
      const review = await ctx.db.serviceComment.create({
        data: {
          ownerId: owner.id,
          content: input.content,
          ratingId: input.reviewId,
        },
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "The review you are trying to reply to does not exist",
        });
      }

      return {
        replierId: ctx.session.user.id,
        replierName: ctx.session.user.name,
        ...review,
      };
    }),
});
