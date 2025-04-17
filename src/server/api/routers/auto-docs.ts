import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import SwaggerParser from "@apidevtools/swagger-parser";

export const autoDocsRouter = createTRPCRouter({
  validateOpenApiSpec: protectedProcedure
    .input(
      z.object({
        fileContent: z.string(),
        description: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { fileContent, description } = input;

      try {
        await SwaggerParser.validate(fileContent);

        const parsedSpec = await SwaggerParser.parse(fileContent);

        if (description) {
          const originalDescription = parsedSpec.info?.description;

          const newDescription = `${originalDescription}\n\n${description}`;

          parsedSpec.info.description = newDescription;
        }

        return JSON.stringify(parsedSpec);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid OpenAPI specification: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),
});
