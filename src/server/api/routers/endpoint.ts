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

  getOperation: protectedProcedure
    .input(
      z.object({
        operationId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { operationId } = input;
      const operation = await ctx.db.operation.findUnique({
        where: { id: operationId },
        select: {
          id: true,
          method: true,
          description: true,
          deprecated: true,
          parameters: true,
          requestBody: true,
          responses: true,
        },
      });

      if (!operation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Operation not found",
        });
      }

      return operation;
    }),

  updateOperation: protectedProcedure
    .input(
      z.object({
        operationId: z.string(),
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
            headersJson: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        operationId,
        method,
        description,
        deprecated,
        parameters,
        requestBody,
        responses,
      } = input;

      await ctx.db.operation.update({
        where: { id: operationId },
        data: {
          method,
          description,
          deprecated,
          parameters: {
            deleteMany: {
              id: {
                notIn: parameters.map((parameter) => parameter.id),
              },
            },
            upsert: parameters.map((parameter) => ({
              where: { id: parameter.id },
              update: parameter,
              create: parameter,
            })),
          },
          requestBody: requestBody
            ? {
                upsert: {
                  where: { id: requestBody.id },
                  update: requestBody,
                  create: requestBody,
                },
              }
            : undefined,
          responses: {
            deleteMany: {
              id: {
                notIn: responses.map((response) => response.id),
              },
            },
            upsert: responses.map((response) => ({
              where: { id: response.id },
              update: response,
              create: response,
            })),
          },
        },
      });

      return { success: true };
    }),

  addOperation: protectedProcedure
    .input(
      z.object({
        endpointId: z.string(),
        method: z.nativeEnum(RestMethod),
        description: z.string(),
        deprecated: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { endpointId, method, description, deprecated } = input;

      // First get the endpoint with its operations to check existing methods
      const endpoint = await ctx.db.endPoint.findUnique({
        where: { id: endpointId },
        select: {
          operations: {
            select: {
              method: true,
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

      // Check if the method already exists
      const methodExists = endpoint.operations.some(
        (op) => op.method === method,
      );

      if (methodExists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Operation with method ${method} already exists for this endpoint`,
        });
      }

      const operation = await ctx.db.operation.create({
        data: {
          endPointId: endpointId,
          method,
          description,
          deprecated,
        },
      });

      return operation;
    }),

  deleteOperation: protectedProcedure
    .input(
      z.object({
        operationId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { operationId } = input;

      await ctx.db.operation.delete({
        where: { id: operationId },
      });

      return { success: true };
    }),
});
