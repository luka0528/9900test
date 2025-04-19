import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { RestMethod, ParameterLocation } from "@prisma/client";

export const endpointRouter = createTRPCRouter({
  getEndpoint: protectedProcedure
    .input(
      z.object({
        endpointId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Endpoint not found",
        });
      }

      return endpoint;
    }),

  updateEndpoint: protectedProcedure
    .input(
      z.object({
        endpointId: z.string(),
        path: z.string().min(1),
        operations: z.array(
          z.object({
            id: z.string(),
            method: z.nativeEnum(RestMethod),
            description: z.string(),
            deprecated: z.boolean(),
            parameters: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                description: z.string(),
                required: z.boolean(),
                parameterLocation: z.nativeEnum(ParameterLocation),
                schemaJson: z.string(),
                deprecated: z.boolean(),
              }),
            ),
            requestBody: z
              .object({
                id: z.string(),
                description: z.string(),
                contentJson: z.string(),
              })
              .nullable(),
            responses: z.array(
              z.object({
                id: z.string(),
                statusCode: z.number(),
                description: z.string(),
                contentJson: z.string(),
                headersJson: z.string().nullable(),
              }),
            ),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { endpointId, path, operations } = input;

      // First update the endpoint path
      await ctx.db.endPoint.update({
        where: { id: endpointId },
        data: { path },
      });

      // Then update all operations
      for (const operation of operations) {
        await ctx.db.operation.update({
          where: { id: operation.id },
          data: {
            method: operation.method,
            description: operation.description,
            deprecated: operation.deprecated,
          },
        });

        // Update parameters
        for (const param of operation.parameters) {
          await ctx.db.parameter.update({
            where: { id: param.id },
            data: {
              name: param.name,
              description: param.description,
              required: param.required,
              parameterLocation: param.parameterLocation,
              schemaJson: param.schemaJson,
              deprecated: param.deprecated,
            },
          });
        }

        // Update request body if exists
        if (operation.requestBody) {
          await ctx.db.requestBody.update({
            where: { id: operation.requestBody.id },
            data: {
              description: operation.requestBody.description,
              contentJson: operation.requestBody.contentJson,
            },
          });
        }

        // Update responses
        for (const response of operation.responses) {
          const updateData: {
            statusCode: number;
            description: string;
            contentJson: string;
            headersJson?: string;
          } = {
            statusCode: response.statusCode,
            description: response.description,
            contentJson: response.contentJson,
          };

          if (response.headersJson !== null) {
            updateData.headersJson = response.headersJson;
          }

          await ctx.db.response.update({
            where: { id: response.id },
            data: updateData,
          });
        }
      }

      return { success: true };
    }),
});
