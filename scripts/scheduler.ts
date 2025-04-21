import cron from "node-cron";
import { checkCancelledSubscriptions } from "./checkCancelledSubscriptions";
import { checkRenewals } from "./checkRenewals";

// “0 0 * * *” = every day at 00:00 server time
cron.schedule(
  "0 0 * * *",
  () => {
    console.log("🕛 Running daily checks…");
    checkCancelledSubscriptions();
    checkRenewals();
  },
  {
    timezone: "Australia/Sydney", // or your TZ
  },
);

checkCancelledSubscriptions();
checkRenewals();
