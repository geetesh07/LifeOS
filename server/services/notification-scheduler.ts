import { sendPushNotification } from "./push";
import { storage } from "../storage";
import type { Task, Event } from "@shared/schema";

// In-memory store for scheduled timeouts (by task/event ID)
const scheduledNotifications = new Map<string, NodeJS.Timeout[]>();

// Priority-based notification emojis
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

/**
 * Schedule notifications for a task based on its start time and reminders
 */
export async function scheduleTaskNotifications(task: Task) {
    // Clear any existing scheduled notifications for this task
    cancelTaskNotifications(task.id);

    const timeouts: NodeJS.Timeout[] = [];
    const now = Date.now();

    // Get the workspace and userId for sending notifications
    if (!task.workspaceId) {
        console.log(`[NotifyScheduler] Task ${task.id} has no workspaceId, skipping`);
        return;
    }

    const workspace = await storage.getWorkspace(task.workspaceId);
    if (!workspace?.userId) {
        console.log(`[NotifyScheduler] Task ${task.id} workspace has no userId, skipping`);
        return;
    }

    const userId = workspace.userId;

    // Schedule Reminder 1 (before start time)
    if (task.startDate && task.reminderMinutes && !task.reminderSent) {
        const startTime = new Date(task.startDate).getTime();
        const notifyTime = startTime - (task.reminderMinutes * 60 * 1000);
        const delay = notifyTime - now;

        // If reminder time already passed, just mark as sent without spamming
        if (delay <= 0) {
            console.log(`[NotifyScheduler] Task "${task.title}" reminder 1 time already passed, marking as sent`);
            await storage.markTaskReminderSent(task.id);
        } else {
            console.log(`[NotifyScheduler] Scheduling reminder 1 for task "${task.title}" in ${Math.round(delay / 60000)} minutes`);

            const timeout = setTimeout(async () => {
                const timeStr = formatTimeUntil(task.reminderMinutes!);
                const title = getPriorityTitle(task.priority, false);
                const body = `📅 ${task.title} starts in ${timeStr}`;

                await sendPushNotification(userId, title, body, "/tasks");

                // Log the notification
                await storage.createNotificationLog({
                    userId,
                    workspaceId: task.workspaceId!,
                    title,
                    body,
                    type: 'task_start',
                    relatedId: task.id,
                    deliveryStatus: 'sent',
                });

                // Mark reminder as sent
                await storage.markTaskReminderSent(task.id);

                console.log(`[NotifyScheduler] Sent reminder 1 for task "${task.title}"`);
            }, delay);

            timeouts.push(timeout);
        }
    }

    // Schedule Reminder 2 (before deadline/due time)
    if (task.dueDate && task.reminder2Minutes && !task.reminder2Sent) {
        const dueTime = new Date(task.dueDate).getTime();
        const notifyTime = dueTime - (task.reminder2Minutes * 60 * 1000);
        const delay = notifyTime - now;

        // If reminder time already passed, just mark as sent without spamming
        if (delay <= 0) {
            console.log(`[NotifyScheduler] Task "${task.title}" reminder 2 time already passed, marking as sent`);
            await storage.markTaskReminder2Sent(task.id);
        } else {
            console.log(`[NotifyScheduler] Scheduling reminder 2 for task "${task.title}" in ${Math.round(delay / 60000)} minutes`);

            const timeout = setTimeout(async () => {
                const timeStr = formatTimeUntil(task.reminder2Minutes!);
                const title = getPriorityTitle(task.priority, true);
                const body = `⚠️ ${task.title} - only ${timeStr} left!`;

                await sendPushNotification(userId, title, body, "/tasks");

                // Log the notification
                await storage.createNotificationLog({
                    userId,
                    workspaceId: task.workspaceId!,
                    title,
                    body,
                    type: 'task_deadline',
                    relatedId: task.id,
                    deliveryStatus: 'sent',
                });

                // Mark reminder 2 as sent
                await storage.markTaskReminder2Sent(task.id);

                console.log(`[NotifyScheduler] Sent reminder 2 for task "${task.title}"`);
            }, delay);

            timeouts.push(timeout);
        }
    }

    if (timeouts.length > 0) {
        scheduledNotifications.set(task.id, timeouts);
    }
}

/**
 * Cancel all scheduled notifications for a task
 */
export function cancelTaskNotifications(taskId: string) {
    const timeouts = scheduledNotifications.get(taskId);
    if (timeouts) {
        timeouts.forEach(t => clearTimeout(t));
        scheduledNotifications.delete(taskId);
        console.log(`[NotifyScheduler] Cancelled notifications for task ${taskId}`);
    }
}

/**
 * Schedule notifications for an event
 */
export async function scheduleEventNotification(event: Event) {
    // Cancel existing
    cancelEventNotifications(event.id);

    if (!event.workspaceId || event.reminderSent) return;

    const workspace = await storage.getWorkspace(event.workspaceId);
    if (!workspace?.userId) return;

    const now = Date.now();
    const startTime = new Date(event.startTime).getTime();
    const reminderMins = event.reminderMinutes ?? 15;
    const notifyTime = startTime - (reminderMins * 60 * 1000);
    const delay = notifyTime - now;

    // If reminder time already passed, just mark as sent without spamming
    if (delay <= 0) {
        console.log(`[NotifyScheduler] Event "${event.title}" reminder time already passed, marking as sent`);
        await storage.markEventReminderSent(event.id);
        return;
    }

    console.log(`[NotifyScheduler] Scheduling event reminder for "${event.title}" in ${Math.round(delay / 60000)} minutes`);

    const timeout = setTimeout(async () => {
        const timeStr = formatTimeUntil(reminderMins);
        const title = "📅 Upcoming Event";
        const body = `${event.title} starts in ${timeStr}!`;

        await sendPushNotification(workspace.userId!, title, body, "/calendar");

        await storage.createNotificationLog({
            userId: workspace.userId!,
            workspaceId: event.workspaceId!,
            title,
            body,
            type: 'event_reminder',
            relatedId: event.id,
            deliveryStatus: 'sent',
        });

        await storage.markEventReminderSent(event.id);

        console.log(`[NotifyScheduler] Sent event reminder for "${event.title}"`);
    }, delay);

    scheduledNotifications.set(event.id, [timeout]);
}

/**
 * Cancel all scheduled notifications for an event
 */
export function cancelEventNotifications(eventId: string) {
    const timeouts = scheduledNotifications.get(eventId);
    if (timeouts) {
        timeouts.forEach(t => clearTimeout(t));
        scheduledNotifications.delete(eventId);
    }
}

/**
 * On server startup, re-schedule notifications for all pending tasks/events
 */
export async function initializeNotificationScheduler() {
    console.log("[NotifyScheduler] Initializing notification scheduler...");

    // Get all tasks with pending reminders
    const tasks = await storage.getAllTasksWithPendingReminders();
    for (const task of tasks) {
        await scheduleTaskNotifications(task);
    }

    // Get all events with pending reminders
    const events = await storage.getAllEventsWithPendingReminders();
    for (const event of events) {
        await scheduleEventNotification(event);
    }

    console.log(`[NotifyScheduler] Scheduled ${tasks.length} task reminders and ${events.length} event reminders`);
}
