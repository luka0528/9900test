import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

// Note that documentation will be contained under versions
export const versionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().min(1),
        newVersion: z.string().min(1),
        documentation: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = await ctx.db.service.findUnique({
        where: {
          id: input.serviceId,
        },
      });

      if (!service) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Service does not exist",
        });
      }

      // Check that newVersion does not already exist for serviceId
      const version = await ctx.db.serviceVersion.findUnique({
        where: {
          serviceId_version: {
            serviceId: input.serviceId,
            version: input.newVersion,
          },
        },
      });

      if (version) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This version already exists for the service",
        });
      }

      // Create the version
      await ctx.db.serviceVersion.create({
        data: {
          service: {
            connect: {
              id: input.serviceId,
            },
          },
          description: input.documentation,
          version: input.newVersion,
        },
      });
    }),

  getDocumentation: publicProcedure
    .input(
      z.object({
        serviceId: z.string().min(1),
        serviceVersion: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const version = await ctx.db.serviceVersion.findUnique({
        where: {
          serviceId_version: {
            serviceId: input.serviceId,
            version: input.serviceVersion,
          },
        },
        include: {
          contents: {
            include: {
              rows: true,
            },
          },
        },
      });

      if (!version) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service version not found",
        });
      }

      return {
        versionDescription: version.description,
        contents: version.contents,
      };
    }),
});
