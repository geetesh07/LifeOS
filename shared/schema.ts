import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Workspaces - containers for organizing life areas
export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"), // Nullable - workspaces can be shared or unassigned
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
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  budget: real("budget"),
  hourlyRate: real("hourly_rate"),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [projects.workspaceId], references: [workspaces.id] }),
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  tasks: many(tasks),
  timeEntries: many(timeEntries),
  milestones: many(milestones),
  projectNotes: many(projectNotes),
}));

// Milestones - key project phases and delivery dates
export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const milestonesRelations = relations(milestones, ({ one }) => ({
  project: one(projects, { fields: [milestones.projectId], references: [projects.id] }),
  workspace: one(workspaces, { fields: [milestones.workspaceId], references: [workspaces.id] }),
}));

// Project Notes - discussions and notes for projects
export const projectNotes = pgTable("project_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectNotesRelations = relations(projectNotes, ({ one }) => ({
  project: one(projects, { fields: [projectNotes.projectId], references: [projects.id] }),
  workspace: one(workspaces, { fields: [projectNotes.workspaceId], references: [workspaces.id] }),
}));

// Task Statuses - custom workflow states per workspace
export const taskStatuses = pgTable("task_statuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  order: integer("order").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false),
  isDoneState: boolean("is_done_state").notNull().default(false),
});

export const taskStatusesRelations = relations(taskStatuses, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [taskStatuses.workspaceId], references: [workspaces.id] }),
  tasks: many(tasks),
}));

// Payments
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "set null" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "set null" }),
  amount: real("amount").notNull(),
  currency: varchar("currency").notNull().default("INR"),
  description: text("description"),
  paymentDate: timestamp("payment_date").notNull(),
  paymentMethod: varchar("payment_method"),
  status: varchar("status").notNull().default("received"),
  invoiceNumber: varchar("invoice_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  workspace: one(workspaces, { fields: [payments.workspaceId], references: [workspaces.id] }),
  client: one(clients, { fields: [payments.clientId], references: [clients.id] }),
  project: one(projects, { fields: [payments.projectId], references: [projects.id] }),
}));

// Expenses
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "set null" }),
  amount: real("amount").notNull(),
  currency: varchar("currency").notNull().default("INR"),
  category: varchar("category").notNull(),
  description: text("description"),
  expenseDate: timestamp("expense_date").notNull(),
  vendor: varchar("vendor"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expensesRelations = relations(expenses, ({ one }) => ({
  workspace: one(workspaces, { fields: [expenses.workspaceId], references: [workspaces.id] }),
  project: one(projects, { fields: [expenses.projectId], references: [projects.id] }),
}));

// Quick Todos
export const quickTodos = pgTable("quick_todos", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quickTodosRelations = relations(quickTodos, ({ one }) => ({
  workspace: one(workspaces, { fields: [quickTodos.workspaceId], references: [workspaces.id] }),
}));

// Google OAuth Settings - workspace-specific OAuth credentials
export const googleOAuthSettings = pgTable("google_oauth_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  clientId: text("client_id").notNull(),
  clientSecret: text("client_secret").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Google Calendar Tokens - user-specific OAuth tokens
export const googleCalendarTokens = pgTable("google_calendar_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(), // Link to the user (auth.uid())
  workspaceId: varchar("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }), // Optional: link to workspace if needed
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiryDate: real("expiry_date").notNull(), // Timestamp in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks - core productivity unit
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "set null" }),
  parentTaskId: varchar("parent_task_id"),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"), // todo, in_progress, done (legacy - will be replaced by statusId)
  statusId: varchar("status_id").references(() => taskStatuses.id, { onDelete: "set null" }),
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  color: text("color"),
  // Task timing
  startDate: timestamp("start_date"), // When to start the task
  dueDate: timestamp("due_date"), // Deadline / end time
  // Reminder 1 - before START time
  reminderMinutes: integer("reminder_minutes"),
  reminderSent: boolean("reminder_sent").notNull().default(false),
  // Reminder 2 - before END time (deadline)
  reminder2Minutes: integer("reminder_2_minutes"),
  reminder2Sent: boolean("reminder_2_sent").notNull().default(false),
  estimatedMinutes: integer("estimated_minutes"),
  completedAt: timestamp("completed_at"),
  order: integer("order").notNull().default(0),
  tags: text("tags").array(),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [tasks.workspaceId], references: [workspaces.id] }),
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  taskStatus: one(taskStatuses, { fields: [tasks.statusId], references: [taskStatuses.id] }),
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
  reminderSent: boolean("reminder_sent").notNull().default(false),
  isFromGoogle: boolean("is_from_google").notNull().default(false),
});

export const eventsRelations = relations(events, ({ one }) => ({
  workspace: one(workspaces, { fields: [events.workspaceId], references: [workspaces.id] }),
}));

// User Settings
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  theme: text("theme").notNull().default("system"), // light, dark, system
  defaultWorkspaceId: varchar("default_workspace_id"),
  showQuotes: boolean("show_quotes").notNull().default(true),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  weekStartsOn: integer("week_starts_on").notNull().default(1), // 0 = Sunday, 1 = Monday
});

// Push Subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  keys: jsonb("keys").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification Logs - track sent notifications
export const notificationLogs = pgTable("notification_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  workspaceId: varchar("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull(), // 'task_start', 'task_deadline', 'event_reminder'
  relatedId: varchar("related_id"), // task.id or event.id
  deviceInfo: text("device_info"), // Browser/device info
  deliveryStatus: text("delivery_status").notNull().default("sent"), // sent, delivered, failed
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export const notificationLogsRelations = relations(notificationLogs, ({ one }) => ({
  workspace: one(workspaces, { fields: [notificationLogs.workspaceId], references: [workspaces.id] }),
}));

// Insert Schemas
export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({ id: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export const insertTaskStatusSchema = createInsertSchema(taskStatuses).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({ id: true });
export const insertHabitSchema = createInsertSchema(habits).omit({ id: true });
export const insertHabitCompletionSchema = createInsertSchema(habitCompletions).omit({ id: true });
export const insertDiaryEntrySchema = createInsertSchema(diaryEntries).omit({ id: true });
export const insertNoteSchema = createInsertSchema(notes).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true });
export const insertQuickTodoSchema = createInsertSchema(quickTodos);
export const insertGoogleOAuthSettingsSchema = createInsertSchema(googleOAuthSettings);
export const insertGoogleCalendarTokensSchema = createInsertSchema(googleCalendarTokens);
export const insertMilestoneSchema = createInsertSchema(milestones).omit({ id: true });
export const insertProjectNoteSchema = createInsertSchema(projectNotes).omit({ id: true });
export const insertNotificationLogSchema = createInsertSchema(notificationLogs).omit({ id: true });

// Types
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type TaskStatus = typeof taskStatuses.$inferSelect;
export type InsertTaskStatus = z.infer<typeof insertTaskStatusSchema>;
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
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type QuickTodo = typeof quickTodos.$inferSelect;
export type InsertQuickTodo = z.infer<typeof insertQuickTodoSchema>;
export type GoogleOAuthSettings = typeof googleOAuthSettings.$inferSelect;
export type InsertGoogleOAuthSettings = z.infer<typeof insertGoogleOAuthSettingsSchema>;
export type GoogleCalendarTokens = typeof googleCalendarTokens.$inferSelect;
export type InsertGoogleCalendarTokens = z.infer<typeof insertGoogleCalendarTokensSchema>;
export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type ProjectNote = typeof projectNotes.$inferSelect;
export type InsertProjectNote = z.infer<typeof insertProjectNoteSchema>;
export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions);
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

// Session table (managed by connect-pg-simple)
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

// User schema
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"), // Optional for now to support existing users
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
