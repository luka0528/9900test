import { test, expect, describe } from "vitest";
import { appRouter } from "~/server/api/root";
import type { PrismaClient } from "@prisma/client";
import { mockDeep } from "vitest-mock-extended";
import { TRPCError } from "@trpc/server";
import { RestMethod, ParameterLocation } from "@prisma/client";

describe("Endpoint Router Tests", () => {
  const prismaMock = mockDeep<PrismaClient>();
  const mockContext = {
    db: prismaMock,
    session: {
      user: { id: "test-user-id", name: "Test User" },
      expires: new Date().toISOString(),
    },
    headers: new Headers(),
  };
  const caller = appRouter.createCaller(mockContext);

  // Helper function to create a mock endpoint
  const createMockEndpoint = (overrides = {}) => ({
    id: "test-endpoint-id",
    path: "/test/path",
    description: "Test endpoint description",
    createdAt: new Date(),
    contentId: "test-content-id",
    operations: [
      {
        id: "test-operation-id",
        method: RestMethod.GET,
        description: "Test operation",
        deprecated: false,
        parameters: [],
        requestBody: null,
        responses: [],
        endPointId: "test-endpoint-id",
      },
    ],
    ...overrides,
  });

  // Helper function to create a mock operation
  const createMockOperation = (overrides = {}) => ({
    id: "test-operation-id",
    method: RestMethod.GET,
    description: "Test operation",
    deprecated: false,
    parameters: [],
    requestBody: null,
    responses: [],
    endPointId: "test-endpoint-id",
    ...overrides,
  });

  describe("getEndpoint", () => {
    test("should return endpoint details", async () => {
      const mockInput = {
        endpointId: "test-endpoint-id",
      };

      const mockEndpoint = createMockEndpoint();
      prismaMock.endPoint.findUnique.mockResolvedValue(mockEndpoint);

      const result = await caller.endpoint.getEndpoint(mockInput);

      expect(result).toEqual(mockEndpoint);
    });

    test("should throw error when endpoint not found", async () => {
      const mockInput = {
        endpointId: "non-existent-endpoint",
      };

      prismaMock.endPoint.findUnique.mockResolvedValue(null);

      await expect(caller.endpoint.getEndpoint(mockInput)).rejects.toThrow(
        TRPCError,
      );
    });
  });

  describe("getOperation", () => {
    test("should return operation details", async () => {
      const mockInput = {
        operationId: "test-operation-id",
      };

      const mockOperation = createMockOperation();
      prismaMock.operation.findUnique.mockResolvedValue(mockOperation);

      const result = await caller.endpoint.getOperation(mockInput);

      expect(result).toEqual(mockOperation);
    });

    test("should throw error when operation not found", async () => {
      const mockInput = {
        operationId: "non-existent-operation",
      };

      prismaMock.operation.findUnique.mockResolvedValue(null);

      await expect(caller.endpoint.getOperation(mockInput)).rejects.toThrow(
        TRPCError,
      );
    });
  });

  describe("updateOperation", () => {
    test("should update operation successfully", async () => {
      const mockInput = {
        operationId: "test-operation-id",
        method: RestMethod.POST,
        description: "Updated description",
        deprecated: true,
        parameters: [
          {
            id: "test-param-id",
            name: "test-param",
            description: "Test parameter",
            required: true,
            parameterLocation: ParameterLocation.QUERY,
            schemaJson: "{}",
            deprecated: false,
          },
        ],
        requestBody: {
          id: "test-request-body-id",
          description: "Test request body",
          contentJson: "{}",
        },
        responses: [
          {
            id: "test-response-id",
            statusCode: 200,
            description: "Success response",
            contentJson: "{}",
            headersJson: "{}",
          },
        ],
      };

      const updatedOperation = {
        id: "test-operation-id",
        endPointId: "test-endpoint-id",
        ...mockInput,
      };

      prismaMock.operation.update.mockResolvedValue(updatedOperation);

      const result = await caller.endpoint.updateOperation(mockInput);

      expect(result.success).toBe(true);
    });
  });

  describe("addOperation", () => {
    test("should add new operation successfully", async () => {
      const mockInput = {
        endpointId: "test-endpoint-id",
        method: RestMethod.PUT,
        description: "New operation",
        deprecated: false,
      };

      const mockEndpoint = createMockEndpoint();
      prismaMock.endPoint.findUnique.mockResolvedValue(mockEndpoint);

      const newOperation = {
        id: "new-operation-id",
        endPointId: "test-endpoint-id",
        ...mockInput,
      };

      prismaMock.operation.create.mockResolvedValue(newOperation);

      const result = await caller.endpoint.addOperation(mockInput);

      expect(result).toHaveProperty("id");
      expect(result.method).toBe(RestMethod.PUT);
    });

    test("should throw error when endpoint not found", async () => {
      const mockInput = {
        endpointId: "non-existent-endpoint",
        method: RestMethod.PUT,
        description: "New operation",
        deprecated: false,
      };

      prismaMock.endPoint.findUnique.mockResolvedValue(null);

      await expect(caller.endpoint.addOperation(mockInput)).rejects.toThrow(
        TRPCError,
      );
    });

    test("should throw error when method already exists", async () => {
      const mockInput = {
        endpointId: "test-endpoint-id",
        method: RestMethod.GET,
        description: "New operation",
        deprecated: false,
      };

      const mockEndpoint = createMockEndpoint();
      prismaMock.endPoint.findUnique.mockResolvedValue(mockEndpoint);

      await expect(caller.endpoint.addOperation(mockInput)).rejects.toThrow(
        TRPCError,
      );
    });
  });

  describe("deleteOperation", () => {
    test("should delete operation successfully", async () => {
      const mockInput = {
        operationId: "test-operation-id",
      };

      const deletedOperation = createMockOperation();
      prismaMock.operation.delete.mockResolvedValue(deletedOperation);

      const result = await caller.endpoint.deleteOperation(mockInput);

      expect(result.success).toBe(true);
    });
  });
});