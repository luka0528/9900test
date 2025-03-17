import { TRPCError } from "@trpc/server";
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

  getAll: publicProcedure.query(async ({ ctx }) => {
    const services = await ctx.db.service.findMany();
    return services;
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
          versions: true,
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

      return {
        name: service.name,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
        tags: service.tags.map((tag) => tag.name),
        versions: service.versions.map((version) => version.version),
        owners: [...ownerIdToName.values()],
        ratings: ratings,
      };
    }),
});
