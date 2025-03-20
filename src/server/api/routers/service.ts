import { TRPCError } from "@trpc/server";
import type { Prisma, Service } from "@prisma/client";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import type { Query } from "~/components/marketplace/MarketplaceQuery";
import { log } from "console";

export const serviceRouter = createTRPCRouter({
  // TODO: There'll be a lot more input here to create a service, this is just a placeholder
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const service = await ctx.db.service.create({
        data: {
          name: input.name,
          owners: {
            create: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      return service;
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
      latestVersion: service.versions[service.versions.length - 1]!.version,
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

  getInfoById: publicProcedure
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
          },
          owners: {
            include: { user: true },
          },
          ratings: {
            include: {
              consumer: { include: { user: true } },
              comments: true,
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

      const ownerIdToName = new Map<string, string>();
      for (const owner of service.owners) {
        ownerIdToName.set(owner.id, owner.user.name!);
      }

      const ratings = [];
      for (const rating of service.ratings) {
        const ownerReplies = new Map();
        for (const reply of rating.comments) {
          ownerReplies.set(reply.id, {
            ownerName: ownerIdToName.get(reply.ownerId),
            content: reply.content,
            createdAt: reply.createdAt,
          });
        }

        ratings.push({
          consumerName: rating.consumer.user.name,
          starValue: rating.starValue,
          content: rating.content,
          createdAt: rating.createdAt,
          comments: ownerReplies.get(rating.id),
        });
      }

      const ownerUserIds = [];
      for (const owner of service.owners) {
        ownerUserIds.push(owner.user.id);
      }

      return {
        name: service.name,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
        tags: service.tags.map((tag) => tag.name),
        versions: service.versions.map((version) => ({
          versionDescription: version.description,
          contents: version.contents,
          version: version.version,
          id: version.id,
        })),
        owners: [...ownerIdToName.keys()],
        ownerUserIds: ownerUserIds,
        ratings: ratings,
      };
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
        price: z.array(z.number()).nullish(),
        dates: z.union([z.array(z.string()), z.string()]).nullish(),
				cursor: z.string().nullish(),
        limit: z.number().default(12),
			})
		)
		.query(async ({ input, ctx }) => {
			const { search, tags, sort, price, dates, cursor, limit } = input;
      const processTags = tags ? (Array.isArray(tags) ? tags : [tags]) : [];
      const processDates = dates ? (Array.isArray(dates) ? dates : [dates]) : [];
      let orderBy: Prisma.ServiceOrderByWithRelationInput = { views : 'desc' };
      let dateFilter: Prisma.ServiceWhereInput = {};
      if (dates && dates.length > 0) {
        const dateConditions = processDates.map(yearStr => {
          const year = parseInt(yearStr);
          // Utilising UTC to avoid timezone issues - need to implement service wide
          const startDate = new Date(`${year}-01-01T00:00:00Z`);
          const endDate = new Date(`${year + 1}-01-01T00:00:00Z`);
          return {
            createdAt: {
              gte: startDate,
              lt: endDate,
            }
          }
        });
        dateFilter = {
          OR: dateConditions,
        }
      }
      const whereClause: Prisma.ServiceWhereInput = {
        ...(search && {
          name : {
            contains: search || "",
            mode: "insensitive"
          },
        }),
        ...(tags && tags.length > 0 && {
          tags: {
            some: {
              name: {
                in: processTags,
              },
            },
          },
        }),
        ...dateFilter,
      }
			const services = await ctx.db.service.findMany({
				where : whereClause,
        orderBy: orderBy,
				cursor: cursor ? { id: cursor } : undefined,
				take: limit,
			});

      const nextCursor = services.length > limit ? services.pop()?.id : null;
			return { services, nextCursor };
		})


});
