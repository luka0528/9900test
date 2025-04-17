import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const endpointRouter = createTRPCRouter({
  getEndpoint: protectedProcedure.input(z.object({
    endpointId: z.string(),
  })).query(async ({ ctx, input }) => {
    const { endpointId } = input;
    const endpoint = await ctx.db.endPoint.findUnique({
      where: { id: endpointId },
      select: {
        path: true,
        operations: {
          select: {
            id: true,
            method: true,
            description: true,
            deprecated: true,
            parameters: true,
            requestBody: true,
            responses: true,
          },
        },
      },
    });

    if (!endpoint) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Endpoint not found" });
    }

    return endpoint;
  }),
});