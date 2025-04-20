import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { db } from "~/server/db";
import { appRouter } from "~/server/api/root";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
    console.log(`✅ Processed subscription renewals: ${count}`);
  } else {
    console.log(`⚠️ No subscription renewals processed.`);
  }
}

checkRenewals().catch((err) => {
  console.error("❌ checkSubscriptionRenewals failed:", err);
  process.exit(1);
});

export async function checkCancellations() {
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

checkCancellations().catch((err) => {
  console.error("❌ checkCancellations failed:", err);
  process.exit(1);
});
