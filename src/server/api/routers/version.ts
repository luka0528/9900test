import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

// Note that documentation will be contained under versions
export const versionRouter = createTRPCRouter({
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

      // Should be exactly one version
      if (service.versions.length !== 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The version does not exist",
        });
      }
      return service.versions[0]!.description;
    }),
});
