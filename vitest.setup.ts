import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock next/server
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn(),
  },
}));

// Mock the next/navigation hooks
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock next-auth
vi.mock("next-auth", () => ({
  default: vi.fn(),
}));

// Mock the env module
vi.mock("~/env", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: "test_db_url",
    // Add any other environment variables your code needs
  },
}));

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock the auth module
vi.mock("~/server/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
  handlers: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
