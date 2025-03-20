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
        versionDescription: z.string().min(1),
        contents: z.array(
          z.object({
            title: z.string().min(1),
            nonTechnicalDocu: z.string(),
            technicalRows: z.array(
              z.object({
                routeName: z.string().min(1),
                routeDocu: z.string().min(1),
              }),
            ),
          }),
        ),
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
      const createdVersion = await ctx.db.serviceVersion.create({
        data: {
          service: {
            connect: {
              id: input.serviceId,
            },
          },
          description: input.versionDescription,
          version: input.newVersion,
          contents: {
            create: input.contents.map((content) => ({
              title: content.title,
              description: content.nonTechnicalDocu,
              rows: {
                create: content.technicalRows.map((row) => ({
                  routeName: row.routeName,
                  description: row.routeDocu,
                })),
              },
            })),
          },
        },
      });

      return createdVersion;
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

  editDocumentation: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().min(1),
        serviceVersion: z.string().min(1),
        versionDescription: z.string().min(1),
        contents: z.array(
          z.object({
            contentId: z.string().min(1),
            title: z.string().min(1),
            nonTechnicalDocu: z.string(),
            technicalRows: z.array(
              z.object({
                rowId: z.string(),
                routeName: z.string(),
                routeDocu: z.string(),
              }),
            ),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check that user owns this service and that this version exists
      const version = await ctx.db.serviceVersion.findUnique({
        where: {
          serviceId_version: {
            serviceId: input.serviceId,
            version: input.serviceVersion,
          },
          service: {
            owners: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });

      if (!version) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service or specified version not found",
        });
      }

      // Edit the documentation
      await ctx.db.serviceVersion.update({
        where: {
          id: version.id,
        },
        data: {
          description: input.versionDescription,
          version: input.serviceVersion,
          contents: {
            upsert: input.contents.map((content) => ({
              where: { id: content.contentId },
              update: {
                title: content.title,
                description: content.nonTechnicalDocu,
                rows: {
                  upsert: content.technicalRows.map((row) => ({
                    where: { id: row.rowId },
                    update: {
                      routeName: row.routeName,
                      description: row.routeDocu,
                    },
                    create: {
                      routeName: row.routeName,
                      description: row.routeDocu,
                    },
                  })),
                },
              },
              create: {
                title: content.title,
                description: content.nonTechnicalDocu,
                rows: {
                  create: content.technicalRows.map((row) => ({
                    routeName: row.routeName,
                    description: row.routeDocu,
                  })),
                },
              },
            })),
          },
        },
      });

      return { success: true };
    }),
});
