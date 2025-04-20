import cron from "node-cron";
import { checkCancellations } from "~/lib/utils";
import { checkRenewals } from "~/lib/utils";

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
