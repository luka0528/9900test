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

      const serviceTags = service.tags.map((tag) => tag.name);

      const serviceVersions = service.versions.map(
        (version) => version.version,
      );
      const ownerNames = service.owners.map((owner) => owner.user.name);
      // Get ratings
      // [
      //	{
      //			consumerName, starValue, content, createdAt, comments: [{ownerName, content, createdAt}]
      //	}
      // ]
    }),

  getDocumentationByVersion: publicProcedure
    .input(
      z.object({
        serviceId: z.string().min(1),
        serviceVersion: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Check service with this version exists
      const service = await ctx.db.service.findUnique({
        where: {
          id: input.serviceId,
        },
        select: {
          versions: {
            where: {
              version: input.serviceVersion,
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

      // Should be an array of length one
      if (service.versions.length !== 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The version does not exist",
        });
      }
      return service.versions[0]!.description;
    }),
});
