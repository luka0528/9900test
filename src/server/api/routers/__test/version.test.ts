import { test, expect, describe } from "vitest";
import { appRouter } from "~/server/api/root";
import type { PrismaClient } from "@prisma/client";
import { mockDeep } from "vitest-mock-extended";
import { TRPCError } from "@trpc/server";
import { ChangeLogPointType } from "@prisma/client";

describe("Version Router Tests", () => {
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

  describe("create", () => {
    test("should create a new version", async () => {
      const mockInput = {
        serviceId: "test-service-id",
        newVersion: "1.0.0",
        versionDescription: "Initial version",
        contents: [
          {
            title: "Test Content",
            description: "Content description",
            endpoints: [
              {
                path: "/test",
                description: "Test endpoint",
              },
            ],
          },
        ],
        changelogPoints: [
          {
            type: ChangeLogPointType.ADDED,
            description: "Added new feature",
          },
        ],
      };

      const mockService = {
        id: "test-service-id",
        owners: [{ user: { id: "test-user-id" } }],
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "New Service",
      };

      const mockVersion = {
        id: "new-version-id",
        version: "1.0.0",
        description: "Initial version",
        createdAt: new Date(),
        updatedAt: new Date(),
        serviceId: "test-service-id",
        isDeprecated: false,
      };

      prismaMock.service.findUnique.mockResolvedValue(mockService);
      prismaMock.serviceVersion.findUnique.mockResolvedValue(null);
      prismaMock.serviceVersion.create.mockResolvedValue(mockVersion);

      const result = await caller.version.create(mockInput);

      expect(result).toHaveProperty("version", "1.0.0");
      expect(result).toHaveProperty("description", "Initial version");
    });

    test("should throw error when service not found", async () => {
      prismaMock.service.findUnique.mockResolvedValue(null);

      await expect(
        caller.version.create({
          serviceId: "non-existent-service",
          newVersion: "1.0.0",
          versionDescription: "Test",
          contents: [],
          changelogPoints: [],
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("should throw error when version already exists", async () => {
      const mockService = {
        id: "test-service-id",
        owners: [{ user: { id: "test-user-id" } }],
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "New Service",
      };

      const mockVersion = {
        id: "existing-version-id",
        version: "1.0.0",
        description: "Initial version",
        createdAt: new Date(),
        updatedAt: new Date(),
        serviceId: "test-service-id",
        isDeprecated: false,
      };

      prismaMock.service.findUnique.mockResolvedValue(mockService);
      prismaMock.serviceVersion.findUnique.mockResolvedValue(mockVersion);

      await expect(
        caller.version.create({
          serviceId: "test-service-id",
          newVersion: "1.0.0",
          versionDescription: "Test",
          contents: [],
          changelogPoints: [],
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getDocumentationByVersionId", () => {
    test("should return version documentation", async () => {
      const mockVersion = {
        id: "version-id",
        version: "1.0.0",
        description: "Test version",
        createdAt: new Date(),
        isDeprecated: false,
        serviceId: "test-service-id",
        contents: [
          {
            id: "content-id",
            title: "Test Content",
            description: "Content description",
            createdAt: new Date(),
            versionId: "version-id",
            endpoints: [
              {
                id: "endpoint-id",
                path: "/test",
                description: "Test endpoint",
                operations: "GET",
                createdAt: new Date(),
                contentId: "content-id",
              },
            ],
          },
        ],
        changelogPoints: [
          {
            id: "changelog-id",
            type: ChangeLogPointType.ADDED,
            description: "Added new feature",
          },
        ],
      };

      prismaMock.serviceVersion.findUnique.mockResolvedValue(mockVersion);

      const result = await caller.version.getDocumentationByVersionId({
        versionId: "version-id",
      });

      expect(result).toHaveProperty("version", "1.0.0");
      expect(result.contents).toHaveLength(1);
      expect(result.changelogPoints).toHaveLength(1);
    });

    test("should throw error when version not found", async () => {
      prismaMock.serviceVersion.findUnique.mockResolvedValue(null);

      await expect(
        caller.version.getDocumentationByVersionId({
          versionId: "non-existent-version",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("editVersion", () => {
    test("should throw error when version not found or user not authorized", async () => {
      prismaMock.serviceVersion.findUnique.mockResolvedValue(null);

      await expect(
        caller.version.editVersion({
          versionId: "non-existent-version",
          newDescription: "Test",
          contents: [],
          changelogPoints: [],
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("updateDeprecated", () => {
    test("should throw error when version not found", async () => {
      prismaMock.serviceVersion.findUnique.mockResolvedValue(null);

      await expect(
        caller.version.updateDeprecated({
          versionId: "non-existent-version",
          isDeprecated: true,
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("should throw error when user not authorized", async () => {
      const mockVersion = {
        service: {
          owners: [{ userId: "different-user-id" }],
        },
        id: "version-id",
        description: "Initial version",
        version: "1.0.0",
        serviceId: "test-service-id",
        createdAt: new Date(),
        isDeprecated: false,
      };

      prismaMock.serviceVersion.findUnique.mockResolvedValue(mockVersion);

      await expect(
        caller.version.updateDeprecated({
          versionId: "version-id",
          isDeprecated: true,
        }),
      ).rejects.toThrow(TRPCError);
    });
  });
});