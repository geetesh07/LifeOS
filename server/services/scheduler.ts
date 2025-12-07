import cron from "node-cron";
import { storage } from "../storage";
import { syncGoogleCalendar } from "./google-calendar";

// This scheduler now only handles Google Calendar sync.
// Task/event notifications are handled by notification-scheduler.ts using setTimeout.

export function setupScheduler() {
    console.log("[SCHEDULER] Starting Google Calendar sync job...");

    // Sync Google Calendar every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
        try {
            console.log("[SCHEDULER] Syncing Google Calendars...");
            const allTokens = await storage.getAllGoogleCalendarTokens();

            for (const token of allTokens) {
                if (token.workspaceId) {
                    await syncGoogleCalendar(token.userId, token.workspaceId);
                }
            }
        } catch (error) {
            console.error("[SCHEDULER] Error in sync job:", error);
        }
    });
}
