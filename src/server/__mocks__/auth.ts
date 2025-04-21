import type { Session } from "next-auth";
import { vi } from "vitest";

// Mock session type that matches your actual session structure
type MockSession = Session & {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
};

// Mock auth function that returns null by default (unauthenticated)
export const auth = vi.fn().mockImplementation((): Promise<MockSession | null> => {
  return Promise.resolve(null);
});

// Export other auth-related functions that might be used
export const handlers = {
  GET: vi.fn(),
  POST: vi.fn(),
};

export const signIn = vi.fn();
export const signOut = vi.fn();