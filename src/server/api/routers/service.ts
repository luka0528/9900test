import type { Service } from "@prisma/client";
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
				query: z.custom<Query>(),
				cursor: z.number().nullish(),
			})
		)
		.query(async ({ input, ctx }) => {
			const { query, cursor } = input;
			const limit = 12;
			const skip = cursor ?? 0;
			const where: any = {
				name: {
					contains: query.search || "",
					mode: "insensitive",
				},
			};
			if (query.tags && query.tags.length > 0) {
				const tags = Array.isArray(query.tags) ? query.tags : [query.tags];
				where.tags = {
					some: {
						name: {
							in: tags,
						},
					},
				};
			}
			const services = await ctx.db.service.findMany({
				where,
				skip: skip,
				take: limit,
			});

			log(services);
			const nextCursor = services.length ? skip + limit : null;
			return { services, nextCursor };
		})


});
