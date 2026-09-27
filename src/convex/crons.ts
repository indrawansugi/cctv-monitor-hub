import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Tick every minute; autoSyncTick decides whether a sync is actually due.
crons.interval("auto-sync tick", { minutes: 1 }, internal.cameras.autoSyncTick, {});

export default crons;
