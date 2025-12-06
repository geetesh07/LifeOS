import cron from "node-cron";
import { storage } from "../storage";
import { sendPushNotification } from "./push";
import { syncGoogleCalendar } from "./google-calendar";
import { addMinutes, isWithinInterval } from "date-fns";

export function setupScheduler() {
    console.log("[SCHEDULER] Starting background jobs...");

    // Check for upcoming tasks/events every minute
    cron.schedule("* * * * *", async () => {
        try {
            // 1. Event Reminders (15 mins default)
            const upcomingEvents = await storage.getUpcomingEvents(15);
            for (const event of upcomingEvents) {
                if (event.workspaceId) {
                    const workspace = await storage.getWorkspace(event.workspaceId);
                    if (workspace && workspace.userId) {
                        await sendPushNotification(
                            workspace.userId,
                            "Upcoming Event",
                            `${event.title} starts in 15 minutes!`,
                            "/calendar"
                        );
                        await storage.markEventReminderSent(event.id);
                    }
                }
            }

            // 2. Task Reminders (Due soon)
            const dueTasks = await storage.getDueTasks(30); // 30 mins before due
            for (const task of dueTasks) {
                if (task.workspaceId) {
                    const workspace = await storage.getWorkspace(task.workspaceId);
                    if (workspace && workspace.userId) {
                        await sendPushNotification(
                            workspace.userId,
                            "Task Due Soon",
                            `${task.title} is due in 30 minutes!`,
                            "/tasks"
                        );
                        await storage.markTaskReminderSent(task.id);
                    }
                }
            }
        } catch (error) {
            console.error("[SCHEDULER] Error in notification job:", error);
        }
    });

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
