// Initialize default task statuses for a workspace
import { db } from "../db";
import { taskStatuses } from "@shared/schema";
import { eq } from "drizzle-orm";

interface DefaultStatus {
    name: string;
    color: string;
    order: number;
    isDefault: boolean;
    isDoneState: boolean;
}

const defaultStatuses: DefaultStatus[] = [
    { name: "To Do", color: "#94a3b8", order: 0, isDefault: true, isDoneState: false },
    { name: "In Progress", color: "#3b82f6", order: 1, isDefault: false, isDoneState: false },
    { name: "Done", color: "#22c55e", order: 2, isDefault: false, isDoneState: true },
];

export async function initializeDefaultStatuses(workspaceId: string): Promise<{ created: boolean; count: number }> {
    try {
        // Check if statuses already exist for this workspace
        const existing = await db.select().from(taskStatuses).where(eq(taskStatuses.workspaceId, workspaceId));

        if (existing.length === 0) {
            console.log(`[Statuses] Initializing ${defaultStatuses.length} default statuses for workspace ${workspaceId}`);
            // Create default statuses
            await db.insert(taskStatuses).values(
                defaultStatuses.map(status => ({
                    ...status,
                    workspaceId,
                }))
            );
            console.log(`[Statuses] Successfully created ${defaultStatuses.length} default statuses`);
            return { created: true, count: defaultStatuses.length };
        } else {
            console.log(`[Statuses] Workspace ${workspaceId} already has ${existing.length} statuses, skipping initialization`);
            return { created: false, count: existing.length };
        }
    } catch (error) {
        console.error(`[Statuses] Error initializing statuses for workspace ${workspaceId}:`, error);
        throw error;
    }
}
