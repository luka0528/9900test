import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  ChangeLogPointType,
  type RestMethod,
  type ParameterLocation,
} from "@prisma/client";
import type {
  OpenAPIDocument,
  OpenAPIOperation,
  OpenAPIParameter,
} from "~/types/openapi";

// Map OpenAPI parameter locations to Prisma ParameterLocation enum
function mapParameterLocation(location: string): ParameterLocation {
  switch (location.toLowerCase()) {
    case "query":
      return "QUERY";
    case "path":
      return "PATH";
    case "header":
      return "HEADER";
    case "body":
      return "BODY";
    case "cookie":
      return "COOKIE";
    default:
      throw new Error(`Invalid parameter location: ${location}`);
  }
}

export const autoDocsRouter = createTRPCRouter({
  createServiceFromOpenApi: protectedProcedure
    .input(
      z.object({
        fileText: z.string(),
        serviceName: z.string(),
        version: z.string(),
        baseEndpoint: z.string(),
        description: z.string(),
        tags: z.array(z.string()).default([]),
        masterAPIKey: z.string(),
        subscriptionTiers: z.array(
          z.object({
            name: z.string(),
            price: z.number(),
            features: z.array(z.string()),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        fileText,
        serviceName,
        version,
        description,
        tags,
        subscriptionTiers,
        masterAPIKey,
        baseEndpoint,
      } = input;

      // Validate OpenAPI spec
      let parsedSpec: OpenAPIDocument;
      try {
        parsedSpec = JSON.parse(fileText) as OpenAPIDocument;
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid OpenAPI specification: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }

      // Create the complete service with all nested structures
      return await ctx.db.service.create({
        data: {
          name: serviceName,
          baseEndpoint,
          masterAPIKey,
          // Connect or create tags
          tags: tags
            ? {
                connectOrCreate: tags.map((tag) => ({
                  where: { name: tag },
                  create: { name: tag },
                })),
              }
            : undefined,
          // Create subscription tiers if provided
          subscriptionTiers: subscriptionTiers
            ? {
                create: subscriptionTiers.map((tier) => ({
                  name: tier.name,
                  price: tier.price,
                  features: {
                    create: tier.features.map((feature) => ({
                      feature,
                    })),
                  },
                })),
              }
            : undefined,
          // Add the current user as a service owner
          owners: {
            create: {
              userId: ctx.session.user.id,
            },
          },
          // Create the initial version with all documentation
          versions: {
            create: {
              version,
              description,
              contents: {
                create: {
                  title: parsedSpec.info.title ?? "API Documentation",
                  description:
                    parsedSpec.info.description ??
                    "Generated from OpenAPI specification",
                  // Create schemas
                  schemas: {
                    create: Object.entries(
                      parsedSpec.components?.schemas ?? {},
                    ).map(([name, schema]) => ({
                      name,
                      schemaJson: JSON.stringify(schema),
                    })),
                  },
                  // Create endpoints and their operations
                  endpoints: {
                    create: Object.entries(parsedSpec.paths).map(
                      ([path, pathItem]) => ({
                        path,
                        description: pathItem?.description ?? "",
                        operations: {
                          create: Object.entries(pathItem)
                            .filter(([method]) =>
                              [
                                "get",
                                "post",
                                "put",
                                "delete",
                                "patch",
                                "options",
                                "head",
                                "trace",
                              ].includes(method),
                            )
                            .map(([method, operation]) => {
                              const op = operation as OpenAPIOperation;
                              return {
                                method: method.toUpperCase() as RestMethod,
                                description: op.description ?? "",
                                deprecated: op.deprecated ?? false,
                                // Create parameters
                                parameters: {
                                  create: (op.parameters ?? []).map(
                                    (param: OpenAPIParameter) => ({
                                      name: param.name,
                                      description: param.description ?? "",
                                      required: param.required ?? false,
                                      deprecated: param.deprecated ?? false,
                                      schemaJson: JSON.stringify(
                                        param.schema ?? {},
                                      ),
                                      parameterLocation: mapParameterLocation(
                                        param.in,
                                      ),
                                      examples: param.examples
                                        ? {
                                            create: Object.entries(
                                              param.examples,
                                            ).map(([_, example]) => ({
                                              example: JSON.stringify(example),
                                            })),
                                          }
                                        : undefined,
                                    }),
                                  ),
                                },
                                // Create request body if it exists
                                requestBody: op.requestBody
                                  ? {
                                      create: {
                                        description:
                                          op.requestBody.description ?? "",
                                        required:
                                          op.requestBody.required ?? false,
                                        contentJson: JSON.stringify(
                                          op.requestBody.content ?? {},
                                        ),
                                      },
                                    }
                                  : undefined,
                                // Create responses
                                responses: {
                                  create: Object.entries(
                                    op.responses ?? {},
                                  ).map(([statusCode, response]) => {
                                    return {
                                      statusCode: parseInt(statusCode),
                                      description: response.description ?? "",
                                      contentJson: JSON.stringify(
                                        response.content ?? {},
                                      ),
                                      headersJson: JSON.stringify(
                                        response.headers ?? {},
                                      ),
                                    };
                                  }),
                                },
                              };
                            }),
                        },
                      }),
                    ),
                  },
                },
              },
              // Add a changelog point for the initial version
              changelogPoints: {
                create: {
                  description:
                    "Initial service version created from OpenAPI specification",
                  type: ChangeLogPointType.ADDED,
                },
              },
            },
          },
        },
        // Include all related data in the response
        select: {
          id: true,
          tags: true,
          subscriptionTiers: {
            include: {
              features: true,
            },
          },
          owners: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          versions: {
            select: {
              id: true,
              version: true,
              contents: {
                select: {
                  id: true,
                  title: true,
                  endpoints: {
                    include: {
                      operations: {
                        include: {
                          parameters: {
                            include: {
                              examples: true,
                            },
                          },
                          requestBody: true,
                          responses: true,
                        },
                      },
                    },
                  },
                  schemas: true,
                },
              },
              changelogPoints: true,
            },
          },
        },
      });
    }),
});
