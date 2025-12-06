import cron from "node-cron";
import { storage } from "../storage";
import { sendPushNotification } from "./push";
import { syncGoogleCalendar } from "./google-calendar";
import { addMinutes, isWithinInterval } from "date-fns";

// Priority-based notification emojis and urgency
const getPriorityEmoji = (priority: string) => {
    switch (priority) {
        case "urgent": return "🚨";
        case "high": return "🔴";
        case "medium": return "🟡";
        default: return "🔵";
    }
};

const getPriorityTitle = (priority: string, isDeadline: boolean) => {
    const emoji = getPriorityEmoji(priority);
    if (priority === "urgent") {
        return isDeadline ? `${emoji} URGENT: Deadline Approaching!` : `${emoji} URGENT Task Reminder`;
    }
    if (priority === "high") {
        return isDeadline ? `${emoji} High Priority Deadline!` : `${emoji} High Priority Task`;
    }
    return isDeadline ? `⏰ Task Due Soon` : `🔔 Task Reminder`;
};

const formatTimeUntil = (mins: number): string => {
    if (mins >= 1440) {
        const days = Math.floor(mins / 1440);
        return `${days} day${days > 1 ? 's' : ''}`;
    }
    if (mins >= 60) {
        const hours = Math.floor(mins / 60);
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${mins} minutes`;
};

export function setupScheduler() {
    console.log("[SCHEDULER] Starting background jobs...");

    // Check for upcoming tasks/events every minute
    cron.schedule("* * * * *", async () => {
        try {
            // 1. Event Reminders
            const upcomingEvents = await storage.getUpcomingEvents(15);
            for (const event of upcomingEvents) {
                if (event.workspaceId) {
                    const workspace = await storage.getWorkspace(event.workspaceId);
                    if (workspace && workspace.userId) {
                        const mins = event.reminderMinutes || 15;
                        const timeStr = formatTimeUntil(mins);
                        await sendPushNotification(
                            workspace.userId,
                            "📅 Upcoming Event",
                            `${event.title} starts in ${timeStr}!`,
                            "/calendar"
                        );
                        await storage.markEventReminderSent(event.id);
                    }
                }
            }

            // 2. Task Reminders - Before START time
            const dueTasks = await storage.getDueTasks(1440); // Default: 1 day
            for (const task of dueTasks) {
                if (task.workspaceId) {
                    const workspace = await storage.getWorkspace(task.workspaceId);
                    if (workspace && workspace.userId) {
                        const mins = task.reminderMinutes || 1440;
                        const timeStr = formatTimeUntil(mins);
                        const title = getPriorityTitle(task.priority, false);
                        await sendPushNotification(
                            workspace.userId,
                            title,
                            `📅 ${task.title} starts in ${timeStr}`,
                            "/tasks"
                        );
                        await storage.markTaskReminderSent(task.id);
                    }
                }
            }

            // 3. Task Reminders - Second Reminder (deadline alert)
            const dueTasks2 = await storage.getDueTasks2(30); // Default: 30 min
            for (const task of dueTasks2) {
                if (task.workspaceId) {
                    const workspace = await storage.getWorkspace(task.workspaceId);
                    if (workspace && workspace.userId) {
                        const mins = task.reminder2Minutes || 30;
                        const timeStr = formatTimeUntil(mins);
                        const title = getPriorityTitle(task.priority, true);
                        await sendPushNotification(
                            workspace.userId,
                            title,
                            `⚠️ ${task.title} - only ${timeStr} left!`,
                            "/tasks"
                        );
                        await storage.markTaskReminder2Sent(task.id);
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
