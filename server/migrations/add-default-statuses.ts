// Migration script to add default statuses to existing workspaces
import { db } from "../db.js";
import { workspaces } from "../../shared/schema.js";
import { initializeDefaultStatuses } from "../lib/initializeStatuses.js";

async function migrateExistingWorkspaces() {
    console.log("Starting migration: Adding default statuses to existing workspaces...");

    const allWorkspaces = await db.select().from(workspaces);

    for (const workspace of allWorkspaces) {
        console.log(`Processing workspace: ${workspace.name} (${workspace.id})`);
        await initializeDefaultStatuses(workspace.id);
    }

    console.log(`✅ Migration complete! Processed ${allWorkspaces.length} workspaces.`);
}

// Run migration
migrateExistingWorkspaces()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    });
