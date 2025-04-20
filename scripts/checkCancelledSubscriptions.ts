import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

export async function checkCancelledSubscriptions() {
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

checkCancelledSubscriptions().catch((err) => {
  console.error("❌ checkCancellations failed:", err);
  process.exit(1);
});
