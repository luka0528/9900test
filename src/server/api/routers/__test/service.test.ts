import { test, expect, describe } from "vitest";
import { appRouter } from "~/server/api/root";
import type { PrismaClient } from "@prisma/client";
import { mockDeep } from "vitest-mock-extended";
import { TRPCError } from "@trpc/server";
import { SubscriptionStatus } from "@prisma/client";
import { b } from "vitest/dist/chunks/suite.d.FvehnV49.js";

describe("Service Router Tests", () => {
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

  describe("getAll", () => {
    test("should return all services", async () => {
      const mockOutput = [
        {
          name: "test-service",
          id: "test-service-id",
          createdAt: new Date(),
          updatedAt: new Date(),
          masterAPIKey: "test-key",
          baseEndpoint: "test-endpoint",
        },
      ];

      prismaMock.service.findMany.mockResolvedValue(mockOutput);

      const result = await caller.service.getAll();

      expect(result).toHaveLength(mockOutput.length);
      expect(result).toStrictEqual(mockOutput);
    });
  });

  describe("getAllByUserId", () => {
    test("should return services owned by user", async () => {
      const mockOutput = [
        {
          id: "test-service-id",
          name: "test-service",
          createdAt: new Date(),
          updatedAt: new Date(),
          masterAPIKey: "test-key",
          baseEndpoint: "test-endpoint",
          owners: [{ user: { name: "Test User" } }],
          tags: [{ name: "test-tag" }],
          versions: [{ version: "1.0.0", id: "version-id" }],
          subscriptionTiers: [
            {
              id: "tier-id",
              name: "Basic",
              price: 10,
              consumers: [],
              billingReceipts: [],
            },
          ],
        },
      ];

      prismaMock.service.findMany.mockResolvedValue(mockOutput);

      const result = await caller.service.getAllByUserId();

      expect(result).toHaveLength(mockOutput.length);
      expect(result[0]).toHaveProperty("id", "test-service-id");
      expect(result[0]).toHaveProperty("name", "test-service");
    });
  });

  describe("create", () => {
    test("should create a new service", async () => {
      const mockInput = {
        name: "New Service",
        version: "1.0.0",
        description: "Test description",
        tags: ["test-tag"],
        masterAPIKey: "test-key",
        baseEndpoint: "test-endpoint",
        subscriptionTiers: [
          {
            name: "Basic",
            price: 10,
            features: ["feature1"],
          },
        ],
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
      };

      const mockService = {
        id: "new-service-id",
        versions: [{ id: "version-id" }],
        name: "New Service",
        createdAt: new Date(),
        updatedAt: new Date(),
        masterAPIKey: "test-key",
        baseEndpoint: "test-endpoint",
      };

      prismaMock.service.create.mockResolvedValue(mockService);

      const result = await caller.service.create(mockInput);

      expect(result).toHaveProperty("serviceId", "new-service-id");
      expect(result).toHaveProperty("versionId", "version-id");
    });

    test("should throw error when not logged in", async () => {
      const unauthenticatedCaller = appRouter.createCaller({
        ...mockContext,
        session: null,
      });

      await expect(
        unauthenticatedCaller.service.create({
          name: "New Service",
          version: "1.0.0",
          description: "Test description",
          tags: [],
          subscriptionTiers: [],
          contents: [],
          masterAPIKey: "test-key",
          baseEndpoint: "test-endpoint",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("delete", () => {
    // TODO: Figure out how to deal with user contexts
    // test("should delete a service", async () => {
    //   const mockService = {
    //     id: "service-to-delete",
    //     name: "New Service",
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   };

    //   prismaMock.service.findUnique.mockResolvedValue(mockService);
    //   prismaMock.service.delete.mockResolvedValue(mockService);

    //   const result = await caller.service.delete({
    //     serviceId: "service-to-delete",
    //   });

    //   expect(result).toHaveProperty("success", true);
    // });

    test("should throw error when service not found", async () => {
      prismaMock.service.findUnique.mockResolvedValue(null);

      await expect(
        caller.service.delete({ serviceId: "non-existent-service" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getServiceByQuery", () => {
    test("should return services matching search criteria", async () => {
      const mockServices = [
        {
          id: "service-id",
          name: "Test Service",
          subscriptionTiers: [{ id: "tier-id", name: "Basic", price: 10 }],
          versions: [
            { id: "version-id", version: "1.0.0", description: "Test" },
          ],
          owners: [{ user: { name: "Test User" } }],
          tags: [{ name: "test-tag" }],
          createdAt: new Date(),
          updatedAt: new Date(),
          masterAPIKey: "test-key",
          baseEndpoint: "test-endpoint",
        },
      ];

      prismaMock.service.findMany.mockResolvedValue(mockServices);

      const result = await caller.service.getServiceByQuery({
        search: "Test",
        tags: ["test-tag"],
        sort: "Name-Asc",
        limit: 12,
      });

      expect(result.services).toHaveLength(1);
      expect(result.services[0]).toHaveProperty("name", "Test Service");
    });
  });

  describe("createReview", () => {
    test("should create a review for a service", async () => {
      const mockService = {
        subscriptionTiers: [{ id: "tier-id" }],
        ratings: [],
        owners: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "New Service",
        id: "service-id",
        masterAPIKey: "test-key",
        baseEndpoint: "test-endpoint",
      };

      const mockConsumer = {
        id: "consumer-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        subscriptionTierId: "tier-id",
        renewingSubscription: false,
        lastRenewed: new Date(),
        subscriptionStartDate: new Date(),
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        userId: "test-user-id",
        paymentMethodId: "payment-method-id",
        apiKey: "test-key",
      };

      const mockRating = {
        id: "rating-id",
        starValue: 5,
        content: "Great service!",
        serviceId: "service-id",
        consumerId: "consumer-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.service.findUnique.mockResolvedValue(mockService);
      prismaMock.serviceConsumer.findFirst.mockResolvedValue(mockConsumer);
      prismaMock.serviceRating.create.mockResolvedValue(mockRating);

      const result = await caller.service.createReview({
        serviceId: "service-id",
        content: "Great service!",
        starValue: 5,
      });

      expect(result).toHaveProperty("starValue", 5);
      expect(result).toHaveProperty("content", "Great service!");
    });

    test("should throw error when user is service owner", async () => {
      const mockService = {
        subscriptionTiers: [{ id: "tier-id" }],
        ratings: [],
        owners: [{ userId: "test-user-id" }],
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "New Service",
        id: "service-id",
        masterAPIKey: "test-key",
        baseEndpoint: "test-endpoint",
      };

      prismaMock.service.findUnique.mockResolvedValue(mockService);

      await expect(
        caller.service.createReview({
          serviceId: "service-id",
          content: "Great service!",
          starValue: 5,
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("editReview", () => {
    test("should edit an existing review", async () => {
      const mockReview = {
        id: "review-id",
        createdAt: new Date(),
        serviceId: "service-id",
        consumerId: "consumer-id",
        starValue: 5,
        content: "Great service!",
        consumer: { userId: "test-user-id" },
      };

      const mockUpdatedReview = {
        id: "review-id",
        createdAt: new Date(),
        serviceId: "service-id",
        consumerId: "consumer-id",
        starValue: 4,
        content: "Updated review",
      };

      prismaMock.serviceRating.findUnique.mockResolvedValue(mockReview);
      prismaMock.serviceRating.update.mockResolvedValue(mockUpdatedReview);

      const result = await caller.service.editReview({
        reviewId: "review-id",
        newContent: "Updated review",
        newRating: 4,
      });

      expect(result).toHaveProperty("content", "Updated review");
      expect(result).toHaveProperty("starValue", 4);
    });

    test("should throw error when review not found", async () => {
      prismaMock.serviceRating.findUnique.mockResolvedValue(null);

      await expect(
        caller.service.editReview({
          reviewId: "non-existent-review",
          newContent: "Updated review",
          newRating: 4,
        }),
      ).rejects.toThrow(TRPCError);
    });
  });
});
