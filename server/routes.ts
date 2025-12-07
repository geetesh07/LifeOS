import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { initializeDefaultStatuses } from "./lib/initializeStatuses";
import {
  insertWorkspaceSchema, insertClientSchema, insertProjectSchema,
  insertTaskStatusSchema, insertTaskSchema, insertTimeEntrySchema, insertHabitSchema,
  insertHabitCompletionSchema, insertDiaryEntrySchema, insertNoteSchema,
  insertEventSchema, insertPaymentSchema, insertExpenseSchema,
  insertMilestoneSchema, insertProjectNoteSchema,
} from "@shared/schema";
import { google } from "googleapis";
import { format } from "date-fns";
import { getOAuthClient, syncGoogleCalendar } from "./services/google-calendar";
import { getVapidPublicKey } from "./services/push";
import { scheduleTaskNotifications, cancelTaskNotifications, scheduleEventNotification, cancelEventNotifications } from "./services/notification-scheduler";

export async function registerRoutes(server: Server, app: Express): Promise<void> {
  // Health Check
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Push Notifications - VAPID public key
  app.get("/api/vapid-public-key", (req, res) => {
    res.json({ publicKey: getVapidPublicKey() });
  });

  // Push Notifications - Subscribe
  app.post("/api/push/subscribe", async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys) {
        return res.status(400).json({ error: "Invalid subscription data" });
      }

      await storage.savePushSubscription({
        userId,
        endpoint,
        keys,
      });

      console.log(`[PUSH] Subscription saved for user ${userId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("[PUSH] Error saving subscription:", error);
      res.status(500).json({ error: "Failed to save subscription" });
    }
  });

  // Workspaces
  app.get("/api/workspaces", async (req, res) => {
    try {
      const workspaces = await storage.getWorkspaces();
      res.json(workspaces);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workspaces" });
    }
  });

  app.get("/api/workspaces/:id", async (req, res) => {
    try {
      const workspace = await storage.getWorkspace(req.params.id);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      res.json(workspace);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workspace" });
    }
  });

  app.post("/api/workspaces", async (req, res) => {
    try {
      const data = insertWorkspaceSchema.parse(req.body);
      // Auto-set userId from authenticated user
      const userId = req.user?.id;
      const workspaceData = { ...data, userId: userId || data.userId };
      const workspace = await storage.createWorkspace(workspaceData);
      // Initialize default task statuses for new workspace
      await initializeDefaultStatuses(workspace.id);
      res.status(201).json(workspace);
    } catch (error) {
      res.status(400).json({ error: "Invalid workspace data" });
    }
  });

  app.patch("/api/workspaces/:id", async (req, res) => {
    try {
      const workspace = await storage.updateWorkspace(req.params.id, req.body);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      res.json(workspace);
    } catch (error) {
      res.status(500).json({ error: "Failed to update workspace" });
    }
  });

  app.delete("/api/workspaces/:id", async (req, res) => {
    try {
      const success = await storage.deleteWorkspace(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workspace" });
    }
  });

  // Notification Logs
  app.get("/api/notification-logs", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getNotificationLogs(userId, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification logs" });
    }
  });

  app.delete("/api/notification-logs", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      await storage.clearNotificationLogs(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear notification logs" });
    }
  });

  // Fix workspaces with null userId - sets current user as owner
  app.post("/api/workspaces/fix-userid", async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const workspaces = await storage.getWorkspaces();
      let fixed = 0;
      for (const ws of workspaces) {
        if (!ws.userId) {
          await storage.updateWorkspace(ws.id, { userId });
          fixed++;
        }
      }
      res.json({ message: `Fixed ${fixed} workspaces`, fixed });
    } catch (error) {
      res.status(500).json({ error: "Failed to fix workspaces" });
    }
  });

  // Clients
  app.get("/api/clients", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId is required" });
      }
      const clients = await storage.getClients(workspaceId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const data = insertClientSchema.parse(req.body);
      const client = await storage.createClient(data);
      res.status(201).json(client);
    } catch (error) {
      res.status(400).json({ error: "Invalid client data" });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.updateClient(req.params.id, req.body);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const success = await storage.deleteClient(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  // Projects
  app.get("/api/projects", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId is required" });
      }
      const projects = await storage.getProjects(workspaceId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      // Convert date strings to Date objects
      const data = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      };
      const validatedData = insertProjectSchema.parse(data);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const success = await storage.deleteProject(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Task Statuses
  app.get("/api/task-statuses", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId || workspaceId === 'undefined') {
        console.log("[API] Task statuses request missing workspaceId");
        return res.status(400).json({ error: "workspaceId is required" });
      }
      console.log(`[API] Fetching task statuses for workspace: ${workspaceId}`);
      const statuses = await storage.getTaskStatuses(workspaceId);
      console.log(`[API] Found ${statuses.length} statuses for workspace ${workspaceId}`);

      // If no statuses exist, initialize them
      if (statuses.length === 0) {
        console.log(`[API] No statuses found, initializing defaults for workspace ${workspaceId}`);
        const result = await initializeDefaultStatuses(workspaceId);
        console.log(`[API] Initialized ${result.count} default statuses`);
        // Fetch again after initialization
        const newStatuses = await storage.getTaskStatuses(workspaceId);
        return res.json(newStatuses);
      }

      res.json(statuses);
    } catch (error) {
      console.error("[API] Error fetching task statuses:", error);
      res.status(500).json({ error: "Failed to fetch task statuses" });
    }
  });

  app.post("/api/task-statuses", async (req, res) => {
    try {
      const data = insertTaskStatusSchema.parse(req.body);
      const status = await storage.createTaskStatus(data);
      res.status(201).json(status);
    } catch (error) {
      console.error("Task status creation error:", error);
      res.status(400).json({ error: "Invalid task status data" });
    }
  });

  app.patch("/api/task-statuses/:id", async (req, res) => {
    try {
      const status = await storage.updateTaskStatus(req.params.id, req.body);
      if (!status) {
        return res.status(404).json({ error: "Task status not found" });
      }
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task status" });
    }
  });

  app.delete("/api/task-statuses/:id", async (req, res) => {
    try {
      const success = await storage.deleteTaskStatus(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Task status not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task status" });
    }
  });

  app.patch("/api/task-statuses/reorder", async (req, res) => {
    try {
      const { workspaceId, statusIds } = req.body;
      if (!workspaceId || !statusIds || !Array.isArray(statusIds)) {
        return res.status(400).json({ error: "Invalid request data" });
      }
      const success = await storage.reorderTaskStatuses(workspaceId, statusIds);
      if (!success) {
        return res.status(500).json({ error: "Failed to reorder statuses" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reorder task statuses" });
    }
  });

  // Tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId is required" });
      }
      const tasks = await storage.getTasks(workspaceId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      // Convert date strings to Date objects (dates are serialized as strings over HTTP)
      const data = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      };
      const validatedData = insertTaskSchema.parse(data);
      const task = await storage.createTask(validatedData);

      // Schedule notifications for this task
      scheduleTaskNotifications(task);

      res.status(201).json(task);
    } catch (error) {
      console.error("Task creation error:", error);
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      // Convert date fields if present
      const updates = {
        ...req.body,
        ...(req.body.startDate !== undefined && {
          startDate: req.body.startDate ? new Date(req.body.startDate) : null
        }),
        ...(req.body.dueDate !== undefined && {
          dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null
        }),
        ...(req.body.completedAt !== undefined && {
          completedAt: req.body.completedAt ? new Date(req.body.completedAt) : null
        }),
      };

      console.log(`[API] Updating task ${req.params.id}:`, updates);
      const task = await storage.updateTask(req.params.id, updates);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Reschedule notifications for this task
      scheduleTaskNotifications(task);

      res.json(task);
    } catch (error) {
      console.error("[API] Task update error:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      // Cancel any scheduled notifications
      cancelTaskNotifications(req.params.id);

      const success = await storage.deleteTask(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Time Entries
  app.get("/api/time-entries", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId is required" });
      }
      const entries = await storage.getTimeEntries(workspaceId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time entries" });
    }
  });

  app.post("/api/time-entries", async (req, res) => {
    try {
      // Convert date strings to Date objects (dates are serialized as strings over HTTP)
      const data = {
        ...req.body,
        startTime: req.body.startTime ? new Date(req.body.startTime) : new Date(),
        endTime: req.body.endTime ? new Date(req.body.endTime) : null,
      };
      const validatedData = insertTimeEntrySchema.parse(data);
      const entry = await storage.createTimeEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Time entry creation error:", error);
      console.error("Request body:", req.body);
      res.status(400).json({
        error: "Invalid time entry data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.patch("/api/time-entries/:id", async (req, res) => {
    try {
      // Convert date strings to Date objects if present
      const updates = {
        ...req.body,
        ...(req.body.startTime && { startTime: new Date(req.body.startTime) }),
        ...(req.body.endTime && { endTime: new Date(req.body.endTime) }),
      };
      const entry = await storage.updateTimeEntry(req.params.id, updates);
      if (!entry) {
        return res.status(404).json({ error: "Time entry not found" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Time entry update error:", error);
      console.error("Update data:", req.body);
      res.status(500).json({ error: "Failed to update time entry" });
    }
  });

  app.delete("/api/time-entries/:id", async (req, res) => {
    try {
      const success = await storage.deleteTimeEntry(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Time entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete time entry" });
    }
  });

  // Habits
  app.get("/api/habits", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId is required" });
      }
      const habits = await storage.getHabits(workspaceId);
      res.json(habits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habits" });
    }
  });

  app.post("/api/habits", async (req, res) => {
    try {
      const data = insertHabitSchema.parse(req.body);
      const habit = await storage.createHabit(data);
      res.status(201).json(habit);
    } catch (error) {
      res.status(400).json({ error: "Invalid habit data" });
    }
  });

  app.patch("/api/habits/:id", async (req, res) => {
    try {
      const habit = await storage.updateHabit(req.params.id, req.body);
      if (!habit) {
        return res.status(404).json({ error: "Habit not found" });
      }
      res.json(habit);
    } catch (error) {
      res.status(500).json({ error: "Failed to update habit" });
    }
  });

  app.delete("/api/habits/:id", async (req, res) => {
    try {
      const success = await storage.deleteHabit(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Habit not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit" });
    }
  });

  // Habit Completions
  app.get("/api/habit-completions", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId is required" });
      }
      const completions = await storage.getHabitCompletions(workspaceId);
      res.json(completions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit completions" });
    }
  });

  app.post("/api/habit-completions", async (req, res) => {
    try {
      const data = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : new Date(),
      };
      const completion = await storage.createHabitCompletion(insertHabitCompletionSchema.parse(data));
      res.status(201).json(completion);
    } catch (error) {
      console.error("Habit completion error:", error);
      res.status(400).json({ error: "Invalid completion data" });
    }
  });

  // Diary Entries
  app.get("/api/diary-entries", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId is required" });
      }
      const entries = await storage.getDiaryEntries(workspaceId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch diary entries" });
    }
  });

  app.post("/api/diary-entries", async (req, res) => {
    try {
      // Ensure date is a Date object
      const data = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : new Date(),
      };
      const validatedData = insertDiaryEntrySchema.parse(data);
      const entry = await storage.createDiaryEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Diary entry creation error:", error);
      res.status(400).json({
        error: "Invalid diary entry data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.patch("/api/diary-entries/:id", async (req, res) => {
    try {
      console.log("Diary update request body:", JSON.stringify(req.body, null, 2));
      // Convert date string to Date object if present, otherwise remove from data
      const data: Record<string, any> = { ...req.body };
      if (data.date) {
        data.date = new Date(data.date);
      } else {
        delete data.date; // Don't pass undefined/null date
      }
      console.log("Processed data:", data);
      const entry = await storage.updateDiaryEntry(req.params.id, data);
      if (!entry) {
        return res.status(404).json({ error: "Diary entry not found" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Diary entry update error:", error);
      res.status(500).json({ error: "Failed to update diary entry" });
    }
  });

  app.delete("/api/diary-entries/:id", async (req, res) => {
    try {
      const success = await storage.deleteDiaryEntry(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Diary entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete diary entry" });
    }
  });

  // Notes
  app.get("/api/notes", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId is required" });
      }
      const notes = await storage.getNotes(workspaceId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const data = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(data);
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid note data" });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.updateNote(req.params.id, req.body);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const success = await storage.deleteNote(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // Events
  app.get("/api/events", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId is required" });
      }
      const events = await storage.getEvents(workspaceId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const data = {
        ...req.body,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
      };
      const validatedData = insertEventSchema.parse(data);

      // 1. Create local event first
      let event = await storage.createEvent(validatedData);

      // 2. Check if connected to Google Calendar and push
      // We need userId to check connection. It should be passed in body or we need a way to get it.
      // For now, let's assume the frontend passes userId in the request body for this operation if they want sync.
      // Or we can look up the workspace owner? No, workspace can have multiple users.
      // Let's rely on the frontend passing `userId` in the body for now, or we fetch it from the workspace if single user.
      // The `insertEventSchema` doesn't have userId. 
      // We'll check if `req.body.userId` exists (it's not in schema but passed in request).

      const userId = req.body.userId;
      const workspaceId = validatedData.workspaceId;

      if (userId && workspaceId) {
        const tokens = await storage.getGoogleCalendarTokens(userId);
        if (tokens) {
          try {
            const oauth2Client = await getOAuthClient(workspaceId);
            oauth2Client.setCredentials({
              access_token: tokens.accessToken,
              refresh_token: tokens.refreshToken,
              expiry_date: tokens.expiryDate
            });

            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
            const googleEvent = await calendar.events.insert({
              calendarId: 'primary',
              requestBody: {
                summary: validatedData.title,
                description: validatedData.description || '',
                location: validatedData.location || '',
                start: validatedData.isAllDay
                  ? { date: format(validatedData.startTime, 'yyyy-MM-dd') }
                  : { dateTime: validatedData.startTime.toISOString() },
                end: validatedData.isAllDay
                  ? { date: format(validatedData.endTime, 'yyyy-MM-dd') }
                  : { dateTime: validatedData.endTime.toISOString() },
              }
            });

            // Update local event with Google ID
            if (googleEvent.data.id) {
              const updated = await storage.updateEvent(event.id, {
                googleEventId: googleEvent.data.id,
                isFromGoogle: true
              });
              if (updated) event = updated;
            }
          } catch (googleError) {
            console.error("Failed to sync to Google Calendar:", googleError);
            // Don't fail the request, just log it. The event is created locally.
          }
        }
      }

      res.status(201).json(event);
    } catch (error) {
      console.error("Event creation error:", error);
      res.status(400).json({
        error: "Invalid event data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.patch("/api/events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      const updates = req.body;

      // 1. Update local event
      const event = await storage.updateEvent(eventId, updates);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // 2. Sync to Google if it has a Google ID
      if (event.googleEventId && event.isFromGoogle) {
        const userId = req.body.userId; // Need userId passed in body
        const workspaceId = event.workspaceId;

        if (userId && workspaceId) {
          const tokens = await storage.getGoogleCalendarTokens(userId);
          if (tokens) {
            try {
              const oauth2Client = await getOAuthClient(workspaceId);
              oauth2Client.setCredentials({
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                expiry_date: tokens.expiryDate
              });

              const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

              // Prepare update body
              // We need to construct the full resource or patch it. Patch is better.
              const requestBody: any = {};
              if (updates.title) requestBody.summary = updates.title;
              if (updates.description !== undefined) requestBody.description = updates.description;
              if (updates.location !== undefined) requestBody.location = updates.location;

              if (updates.startTime || updates.endTime || updates.isAllDay !== undefined) {
                const isAllDay = updates.isAllDay !== undefined ? updates.isAllDay : event.isAllDay;
                const start = updates.startTime ? new Date(updates.startTime) : new Date(event.startTime);
                const end = updates.endTime ? new Date(updates.endTime) : new Date(event.endTime);

                requestBody.start = isAllDay
                  ? { date: format(start, 'yyyy-MM-dd') }
                  : { dateTime: start.toISOString() };
                requestBody.end = isAllDay
                  ? { date: format(end, 'yyyy-MM-dd') }
                  : { dateTime: end.toISOString() };
              }

              await calendar.events.patch({
                calendarId: 'primary',
                eventId: event.googleEventId,
                requestBody,
              });
            } catch (googleError) {
              console.error("Failed to sync update to Google Calendar:", googleError);
            }
          }
        }
      }

      res.json(event);
    } catch (error) {
      console.error("Event update error:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      console.log(`[Delete Event] Request for eventId=${eventId}, query=${JSON.stringify(req.query)}`);

      // Get event first to check for Google ID
      const event = await storage.getEvent(eventId);
      if (!event) {
        console.log("[Delete Event] Event not found locally");
        return res.status(404).json({ error: "Event not found" });
      }

      // 1. Sync delete to Google
      if (event.googleEventId && event.isFromGoogle) {
        const userId = req.query.userId as string; // Pass userId as query param for delete
        const workspaceId = event.workspaceId;

        console.log(`[Delete Event] Attempting Google delete. userId=${userId}, googleEventId=${event.googleEventId}`);

        if (userId && workspaceId && userId !== "undefined") {
          const tokens = await storage.getGoogleCalendarTokens(userId);
          if (tokens) {
            try {
              const oauth2Client = await getOAuthClient(workspaceId);
              oauth2Client.setCredentials({
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                expiry_date: tokens.expiryDate
              });

              const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
              await calendar.events.delete({
                calendarId: 'primary',
                eventId: event.googleEventId,
              });
              console.log("[Delete Event] Deleted from Google Calendar");
            } catch (googleError: any) {
              console.error("Failed to delete from Google Calendar:", googleError);
              // If it's 404 or 410, it's already gone, so we can proceed to delete locally.
              if (googleError.code === 404 || googleError.code === 410) {
                console.log("[Delete Event] Event already gone from Google, proceeding to local delete.");
              }
              // For other errors (403, 500), we still proceed to delete locally because the user wants it gone.
              // The sync logic will handle re-adding it if it really exists on Google later.
            }
          } else {
            console.log("[Delete Event] No tokens found for user");
          }
        } else {
          console.log("[Delete Event] Missing userId or invalid");
        }
      }

      // 2. Delete local event
      const success = await storage.deleteEvent(eventId);
      if (!success) {
        console.log("[Delete Event] Failed to delete locally (after finding it?)");
        return res.status(404).json({ error: "Event not found" });
      }
      console.log("[Delete Event] Deleted locally");
      res.status(204).send();
    } catch (error) {
      console.error("Event deletion error:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Google Calendar Integration endpoints
  // Google Calendar Integration

  // Helper to get OAuth client
  async function getOAuthClient(workspaceId: string) {
    const credentials = await storage.getGoogleOAuthCredentials(workspaceId);
    if (!credentials) {
      throw new Error("Google Calendar credentials not configured for this workspace");
    }

    return new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      `http://localhost:7777/api/google-calendar/callback`
    );
  }

  // Generate Auth URL
  app.get("/api/google-calendar/auth-url", async (req, res) => {
    try {
      const { userId, workspaceId } = req.query;
      if (!userId || !workspaceId) {
        return res.status(400).json({ error: "userId and workspaceId are required" });
      }

      const oauth2Client = await getOAuthClient(workspaceId as string);

      const scopes = [
        'https://www.googleapis.com/auth/calendar', // Full access to Calendar
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ];

      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Required to get refresh token
        scope: scopes,
        state: JSON.stringify({ userId, workspaceId }),
        prompt: 'consent' // Force consent to ensure we get refresh token
      });

      res.json({ url });
    } catch (error) {
      console.error("Error generating auth URL:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate auth URL" });
    }
  });

  // OAuth Callback
  app.get("/api/google-calendar/callback", async (req, res) => {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        return res.status(400).send("Missing code or state");
      }

      const { userId, workspaceId } = JSON.parse(state as string);
      const oauth2Client = await getOAuthClient(workspaceId);

      const { tokens } = await oauth2Client.getToken(code as string);

      if (!tokens.access_token || !tokens.expiry_date) {
        throw new Error("Failed to retrieve valid tokens");
      }

      await storage.saveGoogleCalendarTokens({
        userId,
        workspaceId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || "", // Storage will handle empty refresh token check
        expiryDate: tokens.expiry_date,
      });

      // Redirect back to the application
      res.redirect("/settings");
    } catch (error) {
      console.error("Error in OAuth callback:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Check connection status
  app.get("/api/google-calendar/status", async (req, res) => {
    try {
      const { userId, workspaceId } = req.query;
      if (!userId || !workspaceId) {
        return res.status(400).json({ error: "userId and workspaceId are required" });
      }

      const tokens = await storage.getGoogleCalendarTokens(userId as string);

      if (!tokens) {
        return res.json({ connected: false, message: "Not connected" });
      }

      // If we have tokens, try to fetch user info to verify validity and get email
      let email = "";
      let name = "";
      let picture = "";

      if (workspaceId) {
        try {
          const oauth2Client = await getOAuthClient(workspaceId as string);
          oauth2Client.setCredentials({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            expiry_date: tokens.expiryDate
          });

          const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
          const userInfo = await oauth2.userinfo.get();

          email = userInfo.data.email || "";
          name = userInfo.data.name || "";
          picture = userInfo.data.picture || "";

        } catch (tokenError) {
          console.error("Error fetching user info with token:", tokenError);
          // Token might be invalid, but let's not disconnect automatically yet, just return connected: false or error
          // Or maybe we just return connected: true but no email if it fails?
          // Better to fail gracefully.
        }
      }

      res.json({
        connected: true,
        message: "Connected to Google Calendar",
        email,
        name,
        picture
      });
    } catch (error) {
      console.error("Error checking Google Calendar status:", error);
      res.status(500).json({ error: "Failed to check status" });
    }
  });

  // Disconnect Google Calendar
  app.post("/api/google-calendar/disconnect", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      await storage.deleteGoogleCalendarTokens(userId);
      res.json({ success: true, message: "Disconnected from Google Calendar" });
    } catch (error) {
      console.error("Error disconnecting Google Calendar:", error);
      res.status(500).json({ error: "Failed to disconnect" });
    }
  });

  app.get("/api/google-calendar/events", async (req, res) => {
    try {
      const { userId, workspaceId } = req.query;

      if (!userId || !workspaceId || userId === "undefined" || workspaceId === "undefined") {
        return res.status(400).json({ error: "userId and workspaceId are required" });
      }

      const mappedEvents = await syncGoogleCalendar(userId as string, workspaceId as string);
      res.json(mappedEvents);
    } catch (error) {
      console.error("Error fetching Google Calendar events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/google-calendar/sync", async (req, res) => {
    // Sync is handled via get events for now, but could be expanded to sync to DB
    res.json({ success: true, message: "Calendar sync initiated" });
  });

  // Google OAuth credentials management
  app.post("/api/google-oauth/credentials", async (req, res) => {
    try {
      const { workspaceId, clientId, clientSecret } = req.body;

      if (!workspaceId || !clientId || !clientSecret) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      await storage.saveGoogleOAuthCredentials(workspaceId, clientId, clientSecret);
      res.json({ success: true, message: "Credentials saved successfully" });
    } catch (error) {
      console.error("Error saving OAuth credentials:", error);
      res.status(500).json({ error: "Failed to save credentials" });
    }
  });

  app.get("/api/google-oauth/credentials/:workspaceId", async (req, res) => {
    try {
      const { workspaceId } = req.params;

      const credentials = await storage.getGoogleOAuthCredentials(workspaceId);

      if (!credentials) {
        return res.json({ configured: false });
      }

      // Return masked client secret for security
      res.json({
        configured: true,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret.substring(0, 8) + "..." // Show first 8 chars
      });
    } catch (error) {
      console.error("Error fetching OAuth credentials:", error);
      res.status(500).json({ error: "Failed to fetch credentials" });
    }
  });

  // User Settings
  app.get("/api/user-settings", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    const settings = await storage.getUserSettings(userId);
    res.json(settings || {
      userId,
      theme: "system",
      showQuotes: true,
      notificationsEnabled: true,
      weekStartsOn: 1
    });
  });

  app.patch("/api/user-settings", async (req, res) => {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    const settings = await storage.updateUserSettings(userId, req.body);
    res.json(settings);
  });

  // Admin endpoint to initialize statuses for existing workspaces
  app.post("/api/admin/initialize-statuses", async (req, res) => {
    try {
      const workspaces = await storage.getWorkspaces();
      let initialized = 0;

      for (const workspace of workspaces) {
        await initializeDefaultStatuses(workspace.id);
        initialized++;
      }

      res.json({
        success: true,
        message: `Initialized statuses for ${initialized} workspaces`
      });
    } catch (error) {
      console.error("Status initialization error:", error);
      res.status(500).json({ error: "Failed to initialize statuses" });
    }
  });

  // Admin endpoint to fix tasks with null statusId
  app.post("/api/admin/fix-task-statuses", async (req, res) => {
    try {
      const workspaces = await storage.getWorkspaces();
      let tasksFixed = 0;

      for (const workspace of workspaces) {
        const tasks = await storage.getTasks(workspace.id);
        const statuses = await storage.getTaskStatuses(workspace.id);
        const defaultStatus = statuses.find(s => s.isDefault);

        if (!defaultStatus) {
          console.log(`No default status for workspace ${workspace.name}`);
          continue;
        }

        for (const task of tasks) {
          if (!task.statusId) {
            await storage.updateTask(task.id, { statusId: defaultStatus.id });
            tasksFixed++;
          }
        }
      }

      res.json({
        success: true,
        message: `Fixed ${tasksFixed} tasks with missing status`
      });
    } catch (error) {
      console.error("Task status fix error:", error);
      res.status(500).json({ error: "Failed to fix task statuses" });
    }
  });

  // Payments
  app.get("/api/payments", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId is required" });
      }
      const payments = await storage.getPayments(workspaceId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const data = {
        ...req.body,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : new Date(),
        // Convert empty strings to null for optional foreign keys
        projectId: req.body.projectId || null,
        clientId: req.body.clientId || null,
      };
      const validatedData = insertPaymentSchema.parse(data);
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Payment create error:", error);
      res.status(400).json({ error: "Invalid payment data" });
    }
  });

  // Expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId is required" });
      }
      const expenses = await storage.getExpenses(workspaceId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const data = {
        ...req.body,
        expenseDate: req.body.expenseDate ? new Date(req.body.expenseDate) : new Date(),
      };
      const validatedData = insertExpenseSchema.parse(data);
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Expense create error:", error);
      res.status(400).json({ error: "Invalid expense data" });
    }
  });

  app.patch("/api/payments/:id", async (req, res) => {
    try {
      const data = {
        ...req.body,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : undefined,
        projectId: req.body.projectId || null,
        clientId: req.body.clientId || null,
      };
      const payment = await storage.updatePayment(req.params.id, data);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Payment update error:", error);
      res.status(500).json({ error: "Failed to update payment" });
    }
  });

  app.delete("/api/payments/:id", async (req, res) => {
    try {
      await storage.deletePayment(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete payment" });
    }
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    try {
      const data = {
        ...req.body,
        expenseDate: req.body.expenseDate ? new Date(req.body.expenseDate) : undefined,
        projectId: req.body.projectId || null,
      };
      const expense = await storage.updateExpense(req.params.id, data);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Expense update error:", error);
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      await storage.deleteExpense(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  // Milestones
  app.get("/api/milestones", async (req, res) => {
    try {
      const projectId = req.query.projectId as string;
      if (!projectId) {
        return res.status(400).json({ error: "projectId is required" });
      }
      const milestones = await storage.getMilestones(projectId);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  app.post("/api/milestones", async (req, res) => {
    try {
      const data = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      };
      const validatedData = insertMilestoneSchema.parse(data);
      const milestone = await storage.createMilestone(validatedData);
      res.status(201).json(milestone);
    } catch (error) {
      console.error("Milestone create error:", error);
      res.status(400).json({ error: "Invalid milestone data" });
    }
  });

  app.patch("/api/milestones/:id", async (req, res) => {
    try {
      const data = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        completedAt: req.body.completedAt ? new Date(req.body.completedAt) : undefined,
      };
      const milestone = await storage.updateMilestone(req.params.id, data);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      res.json(milestone);
    } catch (error) {
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });

  app.delete("/api/milestones/:id", async (req, res) => {
    try {
      const success = await storage.deleteMilestone(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Milestone not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete milestone" });
    }
  });

  // Project Notes (Discussions)
  app.get("/api/project-notes", async (req, res) => {
    try {
      const projectId = req.query.projectId as string;
      if (!projectId) {
        return res.status(400).json({ error: "projectId is required" });
      }
      const notes = await storage.getProjectNotes(projectId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project notes" });
    }
  });

  app.post("/api/project-notes", async (req, res) => {
    try {
      const validatedData = insertProjectNoteSchema.parse(req.body);
      const note = await storage.createProjectNote(validatedData);
      res.status(201).json(note);
    } catch (error) {
      console.error("Project note create error:", error);
      res.status(400).json({ error: "Invalid project note data" });
    }
  });

  app.delete("/api/project-notes/:id", async (req, res) => {
    try {
      const success = await storage.deleteProjectNote(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Project note not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project note" });
    }
  });

  // Notification Logs
  app.get("/api/notification-logs", async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getNotificationLogs(userId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Failed to get notification logs:", error);
      res.status(500).json({ error: "Failed to get notification logs" });
    }
  });
}
