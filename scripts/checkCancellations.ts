import { db } from "~/server/db";
import { appRouter } from "~/server/api/root";

export async function run() {
  const ctx = {
    db,
    session: null,
    headers: new Headers(), // ← satisfies the context shape
  };

  const caller = appRouter.createCaller(ctx);

  const { success, count } =
    await caller.subscription.checkSubscriptionCancellations();

  if (success) {
    console.log(`✅ Processed cancellations: ${count}`);
  } else {
    console.log(`⚠️ No cancellations processed.`);
  }
}

run().catch((err) => {
  console.error("❌ checkCancellations failed:", err);
  process.exit(1);
});
