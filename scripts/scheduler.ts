import cron from "node-cron";
import { checkCancellations } from "./checkCancellations";
import { checkRenewals } from "./checkOverdueSubscriptions";

// “0 0 * * *” = every day at 00:00 server time
cron.schedule(
  "0 0 * * *",
  () => {
    console.log("🕛 Running daily cancellation check…");
    checkCancellations();
    checkRenewals();
  },
  {
    timezone: "Australia/Sydney", // or your TZ
  },
);

checkCancellations();
checkRenewals();
