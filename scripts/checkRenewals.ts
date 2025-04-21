import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

export async function checkRenewals() {
  const ctx = {
    db,
    session: null,
    headers: new Headers(), // ← satisfies the context shape
  };

  const caller = appRouter.createCaller(ctx);

  const { success, count } =
    await caller.subscription.checkSubscriptionRenewals();

  if (success) {
    console.log(`✅✅ Processed subscription renewals: ${count}`);
  } else {
    console.log(`⚠️ No subscription renewals processed.`);
  }
}

checkRenewals().catch((err) => {
  console.error("❌ checkSubscriptionRenewals failed:", err);
  process.exit(1);
});
