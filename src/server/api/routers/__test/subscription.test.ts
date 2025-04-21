import { test, expect, describe } from "vitest";
import { appRouter } from "~/server/api/root";
import type { PrismaClient } from "@prisma/client";
import { mockDeep } from "vitest-mock-extended";
import { TRPCError } from "@trpc/server";
import { BillingStatus, SubscriptionStatus, UserRole } from "@prisma/client";
import { vi } from "vitest";

// Mock Stripe
vi.mock("stripe", () => {
  const mockStripe = {
    paymentIntents: {
      create: vi.fn().mockResolvedValue({
        id: "test-payment-intent-id",
        status: "succeeded",
        client_secret: "test-client-secret",
      }),
      retrieve: vi.fn().mockResolvedValue({
        id: "test-payment-intent-id",
        status: "succeeded",
      }),
      confirm: vi.fn().mockResolvedValue({
        id: "test-payment-intent-id",
        status: "succeeded",
      }),
      cancel: vi.fn().mockResolvedValue({
        id: "test-payment-intent-id",
        status: "canceled",
      }),
    },
    customers: {
      create: vi.fn().mockResolvedValue({
        id: "test-customer-id",
      }),
    },
    paymentMethods: {
      attach: vi.fn().mockResolvedValue({
        id: "test-payment-method-id",
      }),
      detach: vi.fn().mockResolvedValue({
        id: "test-payment-method-id",
      }),
      retrieve: vi.fn().mockResolvedValue({
        id: "test-payment-method-id",
        card: {
          brand: "visa",
          last4: "4242",
          exp_month: 12,
          exp_year: 2025,
        },
        billing_details: {
          name: "Test User",
        },
      }),
    },
    setupIntents: {
      create: vi.fn().mockResolvedValue({
        id: "test-setup-intent-id",
        client_secret: "test-client-secret",
      }),
    },
  };

  return {
    default: vi.fn().mockReturnValue(mockStripe),
  };
});

describe("Subscription Router Tests", () => {
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

  // Helper function to create a mock subscription tier
  const createMockSubscriptionTier = (overrides = {}) => ({
    id: "test-tier-id",
    name: "Test Tier",
    price: 10,
    description: "Test description",
    serviceId: "test-service-id",
    createdAt: new Date(),
    updatedAt: new Date(),
    service: {
      id: "test-service-id",
      name: "Test Service",
      description: "Test service description",
      owners: [{ userId: "owner-id" }],
    },
    ...overrides,
  });

  // Helper function to create a mock payment method
  const createMockPaymentMethod = (overrides = {}) => ({
    id: "test-payment-method-id",
    userId: "test-user-id",
    stripeCustomerId: "test-customer-id",
    stripePaymentId: "test-stripe-payment-id",
    cardBrand: "visa",
    last4: "4242",
    expMonth: 12,
    expYear: 2025,
    cardholderName: "Test User",
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
    ...overrides,
  });

  // Helper function to create a mock user
  const createMockUser = (overrides = {}) => ({
    id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
    emailVerified: new Date(),
    password: null,
    image: null,
    bio: null,
    role: UserRole.USER,
    isSubscriptionsPublic: false,
    isRatingsPublic: false,
    isUserDataCollectionAllowed: false,
    stripeCustomerId: "test-customer-id",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  // Helper function to create a mock service consumer
  const createMockServiceConsumer = (overrides = {}) => ({
    id: "test-subscription-id",
    subscriptionTierId: "test-tier-id",
    createdAt: new Date(),
    renewingSubscription: true,
    lastRenewed: new Date(),
    subscriptionStartDate: new Date(),
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    userId: "test-user-id",
    paymentMethodId: "test-payment-method-id",
    ...overrides,
  });

  // Helper function to create a mock billing receipt
  const createMockBillingReceipt = (overrides = {}) => ({
    id: "test-receipt-id",
    status: BillingStatus.PAID,
    description: "Test description",
    date: new Date(),
    subscriptionTierId: "test-tier-id",
    paymentMethodId: "test-payment-method-id",
    amount: 10,
    fromId: "test-user-id",
    toId: "owner-id",
    ...overrides,
  });

  describe("createStripePaymentIntent", () => {
    test("should create a payment intent for a valid subscription", async () => {
      const mockInput = {
        paymentMethodId: "test-payment-method-id",
        subscriptionTierId: "test-tier-id",
      };

      const mockTier = createMockSubscriptionTier();
      const mockPaymentMethod = createMockPaymentMethod();
      const mockUser = createMockUser();

      prismaMock.subscriptionTier.findUnique.mockResolvedValue(mockTier);
      prismaMock.paymentMethod.findUnique.mockResolvedValue(mockPaymentMethod);
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.serviceConsumer.findFirst.mockResolvedValue(null);
      prismaMock.billingReceipt.create.mockResolvedValue(
        createMockBillingReceipt(),
      );

      const result =
        await caller.subscription.createStripePaymentIntent(mockInput);

      expect(result.success).toBe(true);
      expect(result.status).toBe("SUCCESS");
    });

    test("should throw error when subscription tier not found", async () => {
      const mockInput = {
        paymentMethodId: "test-payment-method-id",
        subscriptionTierId: "non-existent-tier",
      };

      prismaMock.subscriptionTier.findUnique.mockResolvedValue(null);

      await expect(
        caller.subscription.createStripePaymentIntent(mockInput),
      ).rejects.toThrow(TRPCError);
    });

    test("should throw error when payment method not found", async () => {
      const mockInput = {
        paymentMethodId: "non-existent-payment-method",
        subscriptionTierId: "test-tier-id",
      };

      const mockTier = createMockSubscriptionTier();
      prismaMock.subscriptionTier.findUnique.mockResolvedValue(mockTier);
      prismaMock.paymentMethod.findUnique.mockResolvedValue(null);

      await expect(
        caller.subscription.createStripePaymentIntent(mockInput),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("subscribeToTier", () => {
    test("should subscribe to a valid tier", async () => {
      const mockInput = {
        tierId: "test-tier-id",
        paymentMethodId: "test-payment-method-id",
        autoRenewal: true,
      };

      const mockTier = createMockSubscriptionTier();
      const mockPaymentMethod = createMockPaymentMethod();

      prismaMock.subscriptionTier.findUnique.mockResolvedValue(mockTier);
      prismaMock.paymentMethod.findUnique.mockResolvedValue(mockPaymentMethod);
      prismaMock.serviceConsumer.findFirst.mockResolvedValue(null);
      prismaMock.serviceConsumer.create.mockResolvedValue(
        createMockServiceConsumer(),
      );

      const result = await caller.subscription.subscribeToTier(mockInput);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Successfully subscribed to service.");
    });

    test("should return error when already subscribed", async () => {
      const mockInput = {
        tierId: "test-tier-id",
        paymentMethodId: "test-payment-method-id",
        autoRenewal: true,
      };

      const mockTier = createMockSubscriptionTier();
      const mockPaymentMethod = createMockPaymentMethod();

      prismaMock.subscriptionTier.findUnique.mockResolvedValue(mockTier);
      prismaMock.paymentMethod.findUnique.mockResolvedValue(mockPaymentMethod);
      prismaMock.serviceConsumer.findFirst.mockResolvedValue(
        createMockServiceConsumer(),
      );

      const result = await caller.subscription.subscribeToTier(mockInput);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Already subscribed");
    });
  });

  describe("unsubscribeToTier", () => {
    test("should unsubscribe from an active subscription", async () => {
      const mockInput = {
        subscriptionTierId: "test-tier-id",
      };

      const mockSubscription = createMockServiceConsumer({
        subscriptionTier: {
          price: 10,
        },
      });

      prismaMock.serviceConsumer.findFirst.mockResolvedValue(mockSubscription);
      prismaMock.serviceConsumer.update.mockResolvedValue({
        ...mockSubscription,
        subscriptionStatus: SubscriptionStatus.PENDING_CANCELLATION,
      });

      const result = await caller.subscription.unsubscribeToTier(mockInput);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Subscription cancelled.");
    });

    test("should return error when subscription not found", async () => {
      const mockInput = {
        subscriptionTierId: "non-existent-tier",
      };

      prismaMock.serviceConsumer.findFirst.mockResolvedValue(null);

      const result = await caller.subscription.unsubscribeToTier(mockInput);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Subscription not found.");
    });
  });

  describe("getUserSubscriptions", () => {
    test("should return user's subscriptions", async () => {
      const mockSubscription = createMockServiceConsumer({
        subscriptionTier: {
          id: "test-tier-id",
          name: "Test Tier",
          service: {
            id: "test-service-id",
            name: "Test Service",
            tags: [],
          },
        },
        paymentMethod: {
          id: "test-payment-method-id",
          cardBrand: "visa",
          last4: "4242",
        },
      });

      prismaMock.serviceConsumer.findMany.mockResolvedValue([mockSubscription]);

      const result = await caller.subscription.getUserSubscriptions();

      expect(result.success).toBe(true);
      expect(result.subscriptions).toHaveLength(1);
      expect(result.subscriptions[0]).toHaveProperty(
        "id",
        "test-subscription-id",
      );
    });
  });

  describe("getPaymentMethods", () => {
    test("should return user's payment methods", async () => {
      const mockPaymentMethod = createMockPaymentMethod();

      prismaMock.paymentMethod.findMany.mockResolvedValue([mockPaymentMethod]);

      const result = await caller.subscription.getPaymentMethods();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id", "test-payment-method-id");
      expect(result[0]).toHaveProperty("cardBrand", "visa");
    });
  });

  describe("deletePaymentMethod", () => {
    test("should delete a payment method", async () => {
      const mockInput = {
        paymentMethodId: "test-payment-method-id",
      };

      const mockPaymentMethod = createMockPaymentMethod();

      prismaMock.paymentMethod.findUnique.mockResolvedValue(mockPaymentMethod);
      prismaMock.paymentMethod.delete.mockResolvedValue(mockPaymentMethod);

      const result = await caller.subscription.deletePaymentMethod(mockInput);

      expect(result.success).toBe(true);
    });

    test("should throw error when payment method not found", async () => {
      const mockInput = {
        paymentMethodId: "non-existent-payment-method",
      };

      prismaMock.paymentMethod.findUnique.mockResolvedValue(null);

      await expect(
        caller.subscription.deletePaymentMethod(mockInput),
      ).rejects.toThrow(TRPCError);
    });
  });
});