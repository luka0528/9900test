import { test, expect, describe } from "vitest";
import { appRouter } from "~/server/api/root";
import type { PrismaClient } from "@prisma/client";
import { mockDeep } from "vitest-mock-extended";
import { TRPCError } from "@trpc/server";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

describe("User Router Tests", () => {
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

  // Helper function to create a complete mock user
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
    stripeCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  describe("register", () => {
    test("should register a new user", async () => {
      const mockInput = {
        name: "New User",
        email: "newuser@example.com",
        password: "password123",
      };

      const mockUser = createMockUser({
        id: "new-user-id",
        name: "New User",
        email: "newuser@example.com",
        password: await bcrypt.hash("password123", 12),
      });

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await caller.user.register(mockInput);

      expect(result).toHaveProperty("id", "new-user-id");
      expect(result).toHaveProperty("name", "New User");
      expect(result).toHaveProperty("email", "newuser@example.com");
    });

    test("should throw error when email already exists", async () => {
      const mockInput = {
        name: "Existing User",
        email: "existing@example.com",
        password: "password123",
      };

      const mockUser = createMockUser({
        id: "existing-user-id",
        name: "Existing User",
        email: "existing@example.com",
        password: await bcrypt.hash("password123", 12),
      });

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(caller.user.register(mockInput)).rejects.toThrow(TRPCError);
    });
  });

  describe("update", () => {
    test("should update user profile", async () => {
      const mockInput = {
        name: "Updated Name",
        email: "updated@example.com",
        bio: "Updated bio",
        isSubscriptionsPublic: true,
        isRatingsPublic: true,
        isUserDataCollectionAllowed: true,
      };

      const mockUser = createMockUser({
        name: "Updated Name",
        email: "updated@example.com",
        bio: "Updated bio",
        isSubscriptionsPublic: true,
        isRatingsPublic: true,
        isUserDataCollectionAllowed: true,
      });

      prismaMock.user.update.mockResolvedValue(mockUser);

      const result = await caller.user.update(mockInput);

      expect(result.success).toBe(true);
      expect(result.user).toHaveProperty("name", "Updated Name");
      expect(result.user).toHaveProperty("email", "updated@example.com");
      expect(result.user).toHaveProperty("bio", "Updated bio");
    });
  });

  describe("getProfile", () => {
    test("should get current user profile", async () => {
      const mockUser = createMockUser({
        bio: "Test bio",
      });

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await caller.user.getProfile();

      expect(result).toHaveProperty("id", "test-user-id");
      expect(result).toHaveProperty("name", "Test User");
      expect(result).toHaveProperty("email", "test@example.com");
    });

    test("should throw error when user not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(caller.user.getProfile()).rejects.toThrow(TRPCError);
    });
  });

  describe("getUserProfile", () => {
    test("should get user profile by ID", async () => {
      const mockUser = createMockUser({
        id: "target-user-id",
        name: "Target User",
        email: "target@example.com",
        bio: "Target bio",
        isSubscriptionsPublic: true,
        isRatingsPublic: true,
        isUserDataCollectionAllowed: true,
      });

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await caller.user.getUserProfile({
        userId: "target-user-id",
      });

      expect(result.success).toBe(true);
      expect(result.user).toHaveProperty("id", "target-user-id");
      expect(result.user).toHaveProperty("name", "Target User");
    });

    test("should return success false when user not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await caller.user.getUserProfile({
        userId: "non-existent-id",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("checkEmailExists", () => {
    test("should return true when email exists", async () => {
      const mockUser = createMockUser({
        email: "test@example.com",
        password: await bcrypt.hash("password123", 12),
      });

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await caller.user.checkEmailExists({
        email: "test@example.com",
      });

      expect(result.success).toBe(true);
      expect(result.exists).toBe(true);
    });

    test("should return false when email does not exist", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await caller.user.checkEmailExists({
        email: "nonexistent@example.com",
      });

      expect(result.success).toBe(true);
      expect(result.exists).toBe(false);
    });
  });

  describe("updatePassword", () => {
    test("should update user password", async () => {
      const mockInput = {
        password: "newpassword123",
      };

      const mockUser = createMockUser({
        password: await bcrypt.hash("newpassword123", 12),
      });

      prismaMock.user.update.mockResolvedValue(mockUser);

      const result = await caller.user.updatePassword(mockInput);

      expect(result.success).toBe(true);
    });
  });

  describe("validateCurrentPassword", () => {
    test("should return true for valid password", async () => {
      const mockUser = createMockUser({
        password: await bcrypt.hash("currentpassword123", 12),
      });

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await caller.user.validateCurrentPassword({
        currentPassword: "currentpassword123",
      });

      expect(result.success).toBe(true);
      expect(result.isValidPassword).toBe(true);
    });

    test("should return false for invalid password", async () => {
      const mockUser = createMockUser({
        password: await bcrypt.hash("currentpassword123", 12),
      });

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await caller.user.validateCurrentPassword({
        currentPassword: "wrongpassword",
      });

      expect(result.success).toBe(true);
      expect(result.isValidPassword).toBe(false);
    });
  });
});