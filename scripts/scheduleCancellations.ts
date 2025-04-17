import cron from "node-cron";
import { run } from "./checkCancellations";

// “0 0 * * *” = every day at 00:00 server time
cron.schedule(
  "0 0 * * *",
  () => {
    console.log("🕛 Running daily cancellation check…");
    run();
  },
  {
    timezone: "Australia/Sydney", // or your TZ
  },
);

run();
