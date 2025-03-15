import { Service } from "@prisma/client";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

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
          query: z.object({
            search: z.string().nullish(),
            sort: z.string().nullish(),
            filters: z.object({
              tags: z.array(z.string()).nullish(),
              price: z.array(z.number()).nullish(),
              dates: z.array(z.number()).nullish(),
            }),
          }),
          cursor: z.number().nullish(),
        })
      )
      .query(async ({ ctx, input }) => {
        const cursor = input.cursor || 0;
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
});
