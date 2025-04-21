import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { ChangeLogPointType, type RestMethod } from "@prisma/client";
import { notifyAllServiceConsumers } from "~/lib/notifications";
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
            description: z.string(),
            endpoints: z.array(
              z.object({
                path: z.string().min(1),
                description: z.string().min(1),
              }),
            ),
          }),
        ),
        changelogPoints: z.array(
          z.object({
            type: z.nativeEnum(ChangeLogPointType),
            description: z.string().min(1),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = await ctx.db.service.findUnique({
        where: {
          id: input.serviceId,
        },
        include: {
          owners: {
            include: {
              user: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!service) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Service does not exist",
        });
      }

      // Check the user is an owner of the service
      const isOwner = service.owners.some(
        (owner) => owner.user.id === ctx.session.user.id,
      );

      if (!isOwner) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are not an owner of the service",
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
              description: content.description,
              endpoints: {
                create: content.endpoints.map((endpoint) => ({
                  path: endpoint.path,
                  description: endpoint.description,
                })),
              },
            })),
          },
          changelogPoints: {
            create: input.changelogPoints.map((changelogPoint) => ({
              type: changelogPoint.type,
              description: changelogPoint.description,
            })),
          },
        },
      });

      return createdVersion;
    }),

  getDocumentationByVersionId: publicProcedure
    .input(
      z.object({
        versionId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const version = await ctx.db.serviceVersion.findUnique({
        where: {
          // TODO: Make this a unique lookup with serviceId_versionId
          id: input.versionId,
        },
        select: {
          description: true,
          version: true,
          createdAt: true,
          isDeprecated: true,
          contents: {
            select: {
              id: true,
              title: true,
              description: true,
              createdAt: true,
              versionId: true,
              endpoints: {
                select: {
                  contentId: true,
                  createdAt: true,
                  id: true,
                  path: true,
                  description: true,
                  operations: true,
                },
              },
            },
          },
          changelogPoints: {
            select: {
              id: true,
              type: true,
              description: true,
            },
          },
        },
      });

      if (!version) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Version not found",
        });
      }

      return version;
    }),

  editVersion: protectedProcedure
    .input(
      z.object({
        versionId: z.string().min(1),
        newDescription: z.string().min(1),
        contents: z.array(
          z.object({
            id: z.string().min(1),
            title: z.string().min(1),
            description: z.string().min(1),
            endpoints: z.array(
              z.object({
                id: z.string().min(1),
                path: z.string().min(1),
                description: z.string().min(1),
              }),
            ),
          }),
        ),
        changelogPoints: z.array(
          z.object({
            id: z.string().min(1),
            type: z.nativeEnum(ChangeLogPointType),
            description: z.string().min(1),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const version = await ctx.db.serviceVersion.findUnique({
        where: {
          id: input.versionId,
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
          message: "Version not found or you do not have permission to edit it",
        });
      }
      // Notify service consumers
      await notifyAllServiceConsumers(
        ctx.db,
        ctx.session.user.id,
        version.serviceId,
        `Version ${version.version} has been updated, please check the documentation for the changes made.`,
      );
      return await ctx.db.serviceVersion.update({
        where: {
          id: input.versionId,
        },
        data: {
          description: input.newDescription,
          // CONTENTS
          contents: {
            deleteMany: {
              id: {
                notIn: input.contents.map((content) => content.id),
              },
            },
            upsert: input.contents.map((content) => ({
              where: { id: content.id },
              update: {
                title: content.title,
                description: content.description,
                // ENDPOINTS
                endpoints: {
                  deleteMany: {
                    id: {
                      notIn: content.endpoints.map((endpoint) => endpoint.id),
                    },
                  },
                  upsert: content.endpoints.map((endpoint) => ({
                    where: { id: endpoint.id },
                    update: {
                      path: endpoint.path,
                      description: endpoint.description,
                    },
                    create: {
                      path: endpoint.path,
                      description: endpoint.description,
                    },
                  })),
                },
              },
              create: {
                title: content.title,
                description: content.description,
                endpoints: {
                  create: content.endpoints.map((endpoint) => ({
                    path: endpoint.path,
                    description: endpoint.description,
                  })),
                },
              },
            })),
          },
          changelogPoints: {
            deleteMany: {
              id: {
                notIn: input.changelogPoints.map(
                  (changelogPoint) => changelogPoint.id,
                ),
              },
            },
            upsert: input.changelogPoints.map((changelogPoint) => ({
              where: { id: changelogPoint.id },
              update: {
                type: changelogPoint.type,
                description: changelogPoint.description,
              },
              create: {
                type: changelogPoint.type,
                description: changelogPoint.description,
              },
            })),
          },
        },
      });
    }),

  updateDeprecated: protectedProcedure
    .input(
      z.object({ versionId: z.string().min(1), isDeprecated: z.boolean() }),
    )
    .mutation(async ({ ctx, input }) => {
      const { versionId, isDeprecated } = input;
      const version = await ctx.db.serviceVersion.findUnique({
        where: { id: versionId },
        select: {
          version: true,
          service: {
            select: {
              owners: true,
            },
          },
        },
      });

      if (!version) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Version not found",
        });
      }

      const isOwner = version.service.owners.some(
        (owner) => owner.userId === ctx.session.user.id,
      );

      if (!isOwner) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are not an owner of the service",
        });
      }

      await ctx.db.serviceVersion.update({
        where: { id: versionId },
        data: { isDeprecated },
      });
      if (isDeprecated) {
        await notifyAllServiceConsumers(
          ctx.db,
          version.service.owners[0]?.userId ?? "",
          version.service.owners[0]?.serviceId ?? "",
          `Version ${version.version} has been deprecated, please check the documentation for the latest version.`,
        );
      }
    }),
});
