import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

// Note that documentation will be contained under versions
export const versionRouter = createTRPCRouter({
  editDocumentation: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().min(1),
        serviceVersion: z.string().min(1),
        newDocumentation: z.string().min(1),
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
          description: input.newDocumentation,
        },
      });

      return { success: true };
    }),
});
