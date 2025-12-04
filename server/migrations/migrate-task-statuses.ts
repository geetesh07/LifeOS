// Migration to assign default status to existing tasks
import { db } from "../db.js";
import { tasks, taskStatuses } from "../../shared/schema.js";
import { eq, isNull, and } from "drizzle-orm";

async function migrateTaskStatuses() {
    console.log("🔄 Migrating existing tasks to use default statuses...");

    // Get all tasks without a statusId
    const tasksWithoutStatus = await db.select().from(tasks).where(isNull(tasks.statusId));

    console.log(`Found ${tasksWithoutStatus.length} tasks without statusId`);

    for (const task of tasksWithoutStatus) {
        // Find the default status for this workspace
        const [defaultStatus] = await db
            .select()
            .from(taskStatuses)
            .where(and(
                eq(taskStatuses.workspaceId, task.workspaceId),
                eq(taskStatuses.isDefault, true)
            ))
            .limit(1);

        if (defaultStatus) {
            await db
                .update(tasks)
                .set({ statusId: defaultStatus.id })
                .where(eq(tasks.id, task.id));

            console.log(`✓ Updated task "${task.title}" with default status`);
        } else {
            console.warn(`⚠️  No default status found for workspace ${task.workspaceId}`);
        }
    }

    console.log("✅ Migration complete!");
}

migrateTaskStatuses()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    });
