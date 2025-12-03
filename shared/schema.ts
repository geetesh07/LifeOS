import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Workspaces - containers for organizing life areas
export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3B82F6"),
  icon: text("icon").notNull().default("briefcase"),
  isDefault: boolean("is_default").notNull().default(false),
  order: integer("order").notNull().default(0),
});

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  projects: many(projects),
  clients: many(clients),
  tasks: many(tasks),
  notes: many(notes),
  habits: many(habits),
  timeEntries: many(timeEntries),
  diaryEntries: many(diaryEntries),
  events: many(events),
}));

// Clients - for project management
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  notes: text("notes"),
  color: text("color").notNull().default("#6366F1"),
});

export const clientsRelations = relations(clients, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [clients.workspaceId], references: [workspaces.id] }),
  projects: many(projects),
}));

// Projects - contain tasks and track billing
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#8B5CF6"),
  status: text("status").notNull().default("active"), // active, completed, archived
  budget: real("budget"),
  hourlyRate: real("hourly_rate"),
  dueDate: timestamp("due_date"),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [projects.workspaceId], references: [workspaces.id] }),
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  tasks: many(tasks),
  timeEntries: many(timeEntries),
}));

// Tasks - core productivity unit
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "set null" }),
  parentTaskId: varchar("parent_task_id"),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"), // todo, in_progress, done
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  color: text("color"),
  dueDate: timestamp("due_date"),
  estimatedMinutes: integer("estimated_minutes"),
  completedAt: timestamp("completed_at"),
  order: integer("order").notNull().default(0),
  tags: text("tags").array(),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [tasks.workspaceId], references: [workspaces.id] }),
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  parentTask: one(tasks, { fields: [tasks.parentTaskId], references: [tasks.id], relationName: "subtasks" }),
  subtasks: many(tasks, { relationName: "subtasks" }),
  timeEntries: many(timeEntries),
}));

// Time Entries - track time spent
export const timeEntries = pgTable("time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "set null" }),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "set null" }),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMinutes: integer("duration_minutes"),
  isBillable: boolean("is_billable").notNull().default(false),
});

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  workspace: one(workspaces, { fields: [timeEntries.workspaceId], references: [workspaces.id] }),
  project: one(projects, { fields: [timeEntries.projectId], references: [projects.id] }),
  task: one(tasks, { fields: [timeEntries.taskId], references: [tasks.id] }),
}));

// Habits - track daily habits with streaks
export const habits = pgTable("habits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#10B981"),
  icon: text("icon").notNull().default("check"),
  frequency: text("frequency").notNull().default("daily"), // daily, weekly
  targetCount: integer("target_count").notNull().default(1),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
});

export const habitsRelations = relations(habits, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [habits.workspaceId], references: [workspaces.id] }),
  completions: many(habitCompletions),
}));

// Habit Completions - daily check-ins
export const habitCompletions = pgTable("habit_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  habitId: varchar("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  count: integer("count").notNull().default(1),
  notes: text("notes"),
});

export const habitCompletionsRelations = relations(habitCompletions, ({ one }) => ({
  habit: one(habits, { fields: [habitCompletions.habitId], references: [habits.id] }),
}));

// Diary Entries - daily journal
export const diaryEntries = pgTable("diary_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  content: text("content").notNull(),
  mood: text("mood"), // great, good, okay, bad, terrible
  tags: text("tags").array(),
});

export const diaryEntriesRelations = relations(diaryEntries, ({ one }) => ({
  workspace: one(workspaces, { fields: [diaryEntries.workspaceId], references: [workspaces.id] }),
}));

// Notes - quick notes with markdown
export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  isPinned: boolean("is_pinned").notNull().default(false),
  color: text("color"),
  tags: text("tags").array(),
});

export const notesRelations = relations(notes, ({ one }) => ({
  workspace: one(workspaces, { fields: [notes.workspaceId], references: [workspaces.id] }),
}));

// Events - calendar events
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  googleEventId: text("google_event_id"),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isAllDay: boolean("is_all_day").notNull().default(false),
  color: text("color"),
  location: text("location"),
  reminderMinutes: integer("reminder_minutes"),
  isFromGoogle: boolean("is_from_google").notNull().default(false),
});

export const eventsRelations = relations(events, ({ one }) => ({
  workspace: one(workspaces, { fields: [events.workspaceId], references: [workspaces.id] }),
}));

// User Settings
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  theme: text("theme").notNull().default("system"), // light, dark, system
  defaultWorkspaceId: varchar("default_workspace_id"),
  showQuotes: boolean("show_quotes").notNull().default(true),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  weekStartsOn: integer("week_starts_on").notNull().default(1), // 0 = Sunday, 1 = Monday
});

// Insert Schemas
export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({ id: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({ id: true });
export const insertHabitSchema = createInsertSchema(habits).omit({ id: true });
export const insertHabitCompletionSchema = createInsertSchema(habitCompletions).omit({ id: true });
export const insertDiaryEntrySchema = createInsertSchema(diaryEntries).omit({ id: true });
export const insertNoteSchema = createInsertSchema(notes).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true });

// Types
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type InsertHabitCompletion = z.infer<typeof insertHabitCompletionSchema>;
export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type InsertDiaryEntry = z.infer<typeof insertDiaryEntrySchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

// Legacy user schema for compatibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
