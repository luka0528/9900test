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

  addTag: protectedProcedure
    .input(z.object({ serviceId: z.string().min(1), tag: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const serviceValid = await ctx.db.service.findUnique({
        where: {
          id: input.serviceId,
        },
        include: {
          owners: {
            where: { userId: ctx.session.user.id },
          },
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

      // // Check if this tag already exists
      // let tagToFind = await ctx.db.tag.findFirst({
      //   where: {
      //     name: tagName,
      //   },
      // });

      // // If the tag already exists, simply add this service to the
      // // relevant tag's services table
      // if (!tagToFind) {
      //   // Create the tag
      //   tagToFind = await ctx.db.tag.create({
      //     data: {
      //       name: tagName,
      //     },
      //   });
      // }

      // // Add the service to the tag's service list
      // let foundTag = await ctx.db.tag.findUnique({
      //   where: {
      //     id: tagToFind.id,
      //   },
      //   select: {
      //     services: true,
      //   },
      // });

      // if (!foundTag) {
      //   throw new TRPCError({
      //     code: "NOT_FOUND",
      //     message: "Service not found",
      //   });
      // }

      // // Get the service (we know it exists now) - TODO repetition here
      // const service = await ctx.db.service.findUnique({
      //   where: {
      //     id: input.serviceId,
      //   },
      // });

      // if (!service) {
      //   throw new TRPCError({
      //     code: "BAD_REQUEST",
      //     message: "This error should never occur",
      //   });
      // }

      // const thing = [...foundTag.services, service];

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

      // Add the tag to relevant service's tags list
    }),
});
