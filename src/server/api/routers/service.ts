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
        })
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

	getByQuery: publicProcedure
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
      let orderBy: Prisma.ServiceOrderByWithRelationInput = { views: 'desc' };
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
