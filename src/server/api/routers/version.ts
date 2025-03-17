import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

// Note that documentation will be contained under versions
export const versionRouter = createTRPCRouter({
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
      });

      if (!version) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service version not found",
        });
      }
      return version.description;
    }),
});
