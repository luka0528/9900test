import { serviceRouter } from "~/server/api/routers/service";
import { userRouter } from "~/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { versionRouter } from "./routers/version";
import { analyticsRouter } from "./routers/analytics";
import { autoDocsRouter } from "./routers/auto-docs";
import { subscriptionRouter } from "./routers/subscription";
import { endpointRouter } from "./routers/endpoint";
if (process.env.NODE_ENV === "development") {
  console.log("🧪 Dev mode: enabling cancellation scheduler...");
  void import("scripts/scheduler");
}

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  service: serviceRouter,
  user: userRouter,
  version: versionRouter,
  analytics: analyticsRouter,
  autoDocs: autoDocsRouter,
  subscription: subscriptionRouter,
  endpoint: endpointRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
