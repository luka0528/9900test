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
            description: z.string(),
            rows: z.array(
              z.object({
                routeName: z.string().min(1),
                description: z.string().min(1),
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
              description: content.description,
              rows: {
                create: content.rows.map((row) => ({
                  routeName: row.routeName,
                  description: row.description,
                })),
              },
            })),
          },
        },
      });

      return createdVersion;
    }),

  getVersionById: publicProcedure
    .input(z.string().min(1))
    .query(async ({ ctx, input }) => {
      const version = await ctx.db.serviceVersion.findUnique({
        where: { id: input },
      });
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
          contents: {
            select: {
              id: true,
              title: true,
              description: true,
              createdAt: true,
              versionId: true,
              rows: {
                select: {
                  contentId: true,
                  createdAt: true,
                  id: true,
                  routeName: true,
                  description: true,
                },
              },
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
            rows: z.array(
              z.object({
                id: z.string().min(1),
                routeName: z.string().min(1),
                description: z.string().min(1),
              }),
            ),
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
                // ROWS
                rows: {
                  deleteMany: {
                    id: {
                      notIn: content.rows.map((row) => row.id),
                    },
                  },
                  upsert: content.rows.map((row) => ({
                    where: { id: row.id },
                    update: {
                      routeName: row.routeName,
                      description: row.description,
                    },
                    create: {
                      routeName: row.routeName,
                      description: row.description,
                    },
                  })),
                },
              },
              create: {
                title: content.title,
                description: content.description,
                rows: {
                  create: content.rows,
                },
              },
            })),
          },
        },
      });
    }),

  createEmptyServiceContent: protectedProcedure
    .input(
      z.object({
        versionId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.serviceContent.create({
        data: {
          version: {
            connect: {
              id: input.versionId,
            },
          },
          title: "",
          description: "",
        },
      });
    }),

  createEmptyServiceContentWithTable: protectedProcedure
    .input(
      z.object({
        versionId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.serviceContent.create({
        data: {
          version: {
            connect: {
              id: input.versionId,
            },
          },
          title: "",
          description: "",
          rows: {
            create: [
              {
                routeName: "",
                description: "",
              },
            ],
          },
        },
      });
    }),

  createServiceContent: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().min(1),
        version: z.string().min(1),
        title: z.string().min(1),
        description: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check user owns the service
      const version = await ctx.db.serviceVersion.findUnique({
        where: {
          serviceId_version: {
            serviceId: input.serviceId,
            version: input.version,
          },
        },
      });

      if (!version) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content table not found",
        });
      }

      // Modify desc
      return await ctx.db.serviceContent.create({
        data: {
          versionId: version.id,
          title: input.title,
          description: input.description,
        },
      });
    }),

  editServiceContent: protectedProcedure
    .input(
      z.object({
        versionId: z.string().min(1),
        contentId: z.string().min(1),
        title: z.string().min(1),
        newDescription: z.string().min(1),
        rows: z.array(
          z.object({
            id: z.string().min(1),
            routeName: z.string().min(1),
            description: z.string().min(1),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check user owns the service
      const content = await ctx.db.serviceContent.findUnique({
        where: {
          id: input.contentId,
          version: {
            id: input.versionId,
            service: {
              owners: {
                some: {
                  userId: ctx.session.user.id,
                },
              },
            },
          },
        },
      });

      if (!content) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content table not found",
        });
      }

      // Modify desc
      return await ctx.db.serviceContent.update({
        where: {
          id: input.contentId,
        },
        data: {
          description: input.newDescription,
          title: input.title,
          rows: {
            deleteMany: {
              id: {
                notIn: input.rows.map((row) => row.id),
              },
            },
            upsert: input.rows.map((row) => ({
              where: { id: row.id },
              update: {
                routeName: row.routeName,
                description: row.description,
              },
              create: {
                routeName: row.routeName,
                description: row.description,
              },
            })),
          },
        },
      });
    }),

  deleteServiceContent: protectedProcedure
    .input(
      z.object({
        versionId: z.string().min(1),
        contentId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check user owns the service
      const deleted = await ctx.db.serviceContent.delete({
        where: {
          id: input.contentId,
          version: {
            id: input.versionId,
            service: {
              owners: {
                some: {
                  userId: ctx.session.user.id,
                },
              },
            },
          },
        },
      });

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content table not found",
        });
      }
    }),

  createRow: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().min(1),
        contentId: z.string().min(1),
        routeName: z.string().min(1),
        routeDesc: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check the user owns this service
      const serviceContent = await ctx.db.serviceContent.findUnique({
        where: {
          id: input.contentId,
          version: {
            service: {
              owners: {
                some: {
                  userId: ctx.session.user.id,
                },
              },
              id: input.serviceId,
            },
          },
        },
      });

      if (!serviceContent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Row not found",
        });
      }

      return await ctx.db.contentTableRow.create({
        data: {
          contentId: input.contentId,
          routeName: input.routeName,
          description: input.routeDesc,
        },
      });
    }),

  editRow: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().min(1),
        rowId: z.string().min(1),
        updatedRouteName: z.string().min(1),
        updatedRouteDesc: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check the user owns this service
      const row = await ctx.db.contentTableRow.findUnique({
        where: {
          id: input.rowId,
          content: {
            version: {
              service: {
                owners: {
                  some: {
                    userId: ctx.session.user.id,
                  },
                },
                id: input.serviceId,
              },
            },
          },
        },
      });

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Row not found",
        });
      }

      return await ctx.db.contentTableRow.update({
        where: {
          id: input.rowId,
        },
        data: {
          routeName: input.updatedRouteName,
          description: input.updatedRouteDesc,
        },
      });
    }),

  deleteRow: protectedProcedure
    .input(
      z.object({
        contentId: z.string().min(1),
        rowId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check the user owns this service
      const deleted = await ctx.db.contentTableRow.delete({
        where: {
          id: input.rowId,
          content: {
            id: input.contentId,
            version: {
              service: {
                owners: {
                  some: { userId: ctx.session.user.id },
                },
              },
            },
          },
        },
      });

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Row not found",
        });
      }
    }),
});
