import { TRPCError } from "@trpc/server";
import type { Service } from "@prisma/client";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import type { Query } from "~/components/marketplace/MarketplaceQuery";

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
});
