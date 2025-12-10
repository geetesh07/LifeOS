import {
  workspaces, clients, projects, tasks, timeEntries,
  habits, habitCompletions, diaryEntries, notes, events, userSettings,
  taskStatuses, googleOAuthSettings, quickTodos, payments, expenses,
  milestones, projectNotes, notificationLogs, projectTodos,
  type Workspace, type InsertWorkspace,
  type Client, type InsertClient,
  type Project, type InsertProject,
  type TaskStatus, type InsertTaskStatus,
  type Task, type InsertTask,
  type TimeEntry, type InsertTimeEntry,
  type Habit, type InsertHabit,
  type HabitCompletion, type InsertHabitCompletion,
  type DiaryEntry, type InsertDiaryEntry,
  type Note, type InsertNote,
  type Event, type InsertEvent,
  type UserSettings, type InsertUserSettings,
  type QuickTodo, type InsertQuickTodo,
  type GoogleOAuthSettings,
  googleCalendarTokens, type GoogleCalendarTokens, type InsertGoogleCalendarTokens,
  users, type User, type InsertUser,
  pushSubscriptions, type PushSubscription, type InsertPushSubscription,
  type Payment, type InsertPayment,
  type Expense, type InsertExpense,
  type Milestone, type InsertMilestone,
  type ProjectNote, type InsertProjectNote,
  type NotificationLog, type InsertNotificationLog,
  type ProjectTodo, type InsertProjectTodo,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, sql, or } from "drizzle-orm";
import { startOfDay, endOfDay, subDays, addMinutes } from "date-fns";

export interface IStorage {
  // Workspaces
  getWorkspaces(): Promise<Workspace[]>;
  getWorkspace(id: string): Promise<Workspace | undefined>;
  createWorkspace(data: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace | undefined>;
  deleteWorkspace(id: string): Promise<boolean>;

  // Clients
  getClients(workspaceId: string): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(data: InsertClient): Promise<Client>;
  updateClient(id: string, data: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  // Projects
  getProjects(workspaceId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(data: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  // Task Statuses
  getTaskStatuses(workspaceId: string): Promise<TaskStatus[]>;
  getTaskStatus(id: string): Promise<TaskStatus | undefined>;
  createTaskStatus(data: InsertTaskStatus): Promise<TaskStatus>;
  updateTaskStatus(id: string, data: Partial<TaskStatus>): Promise<TaskStatus | undefined>;
  deleteTaskStatus(id: string): Promise<boolean>;
  reorderTaskStatuses(workspaceId: string, statusIds: string[]): Promise<boolean>;

  // Tasks
  getTasks(workspaceId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(data: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Time Entries
  getTimeEntries(workspaceId: string): Promise<TimeEntry[]>;
  getTimeEntry(id: string): Promise<TimeEntry | undefined>;
  getActiveTimeEntry(workspaceId: string): Promise<TimeEntry | undefined>;
  createTimeEntry(data: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, data: Partial<TimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: string): Promise<boolean>;

  // Habits
  getHabits(workspaceId: string): Promise<Habit[]>;
  getHabit(id: string): Promise<Habit | undefined>;
  createHabit(data: InsertHabit): Promise<Habit>;
  updateHabit(id: string, data: Partial<Habit>): Promise<Habit | undefined>;
  deleteHabit(id: string): Promise<boolean>;

  // Habit Completions
  getHabitCompletions(workspaceId: string): Promise<HabitCompletion[]>;
  createHabitCompletion(data: InsertHabitCompletion): Promise<HabitCompletion>;
  deleteHabitCompletion(id: string): Promise<boolean>;

  // Diary Entries
  getDiaryEntries(workspaceId: string): Promise<DiaryEntry[]>;
  getDiaryEntry(id: string): Promise<DiaryEntry | undefined>;
  getDiaryEntryByDate(workspaceId: string, date: Date): Promise<DiaryEntry | undefined>;
  createDiaryEntry(data: InsertDiaryEntry): Promise<DiaryEntry>;
  updateDiaryEntry(id: string, data: Partial<DiaryEntry>): Promise<DiaryEntry | undefined>;
  deleteDiaryEntry(id: string): Promise<boolean>;

  // Notes
  getNotes(workspaceId: string): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(data: InsertNote): Promise<Note>;
  updateNote(id: string, data: Partial<Note>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;

  // Events
  getEvents(workspaceId: string): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  getEventByGoogleId(googleEventId: string): Promise<Event | undefined>;
  createEvent(data: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // User Settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  updateUserSettings(userId: string, data: Partial<UserSettings>): Promise<UserSettings>;

  // Google Calendar Tokens
  getGoogleCalendarTokens(userId: string): Promise<GoogleCalendarTokens | undefined>;
  getAllGoogleCalendarTokens(): Promise<GoogleCalendarTokens[]>;
  saveGoogleCalendarTokens(data: InsertGoogleCalendarTokens): Promise<GoogleCalendarTokens>;
  deleteGoogleCalendarTokens(userId: string): Promise<boolean>;

  // Payments
  getPayments(workspaceId: string): Promise<Payment[]>;
  createPayment(data: InsertPayment): Promise<Payment>;
  updatePayment(id: string, data: Partial<Payment>): Promise<Payment | undefined>;
  deletePayment(id: string): Promise<boolean>;

  // Expenses
  getExpenses(workspaceId: string): Promise<Expense[]>;
  createExpense(data: InsertExpense): Promise<Expense>;
  updateExpense(id: string, data: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(identifier: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Push Subscriptions
  getPushSubscription(userId: string): Promise<PushSubscription | undefined>;
  getAllPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  savePushSubscription(data: InsertPushSubscription): Promise<PushSubscription>;

  // Reminders
  getUpcomingEvents(minutes: number): Promise<Event[]>;
  getDueTasks(minutes: number): Promise<Task[]>;
  getDueTasks2(minutes: number): Promise<Task[]>;
  markEventReminderSent(id: string): Promise<void>;
  markTaskReminderSent(id: string): Promise<void>;
  markTaskReminder2Sent(id: string): Promise<void>;
  getAllTasksWithPendingReminders(): Promise<Task[]>;
  getAllEventsWithPendingReminders(): Promise<Event[]>;

  // Milestones
  getMilestones(projectId: string): Promise<Milestone[]>;
  getMilestone(id: string): Promise<Milestone | undefined>;
  createMilestone(data: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: string, data: Partial<Milestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: string): Promise<boolean>;

  // Project Notes
  getProjectNotes(projectId: string): Promise<ProjectNote[]>;
  createProjectNote(data: InsertProjectNote): Promise<ProjectNote>;
  deleteProjectNote(id: string): Promise<boolean>;

  // Notification Logs
  createNotificationLog(data: InsertNotificationLog): Promise<NotificationLog>;
  getNotificationLogs(userId: string, limit?: number): Promise<NotificationLog[]>;
  clearNotificationLogs(userId: string): Promise<void>;

  // Project Todos
  getProjectTodos(projectId: string): Promise<ProjectTodo[]>;
  createProjectTodo(data: InsertProjectTodo): Promise<ProjectTodo>;
  updateProjectTodo(id: string, data: Partial<ProjectTodo>): Promise<ProjectTodo | undefined>;
  deleteProjectTodo(id: string): Promise<boolean>;

  // Subtasks
  getSubtasks(parentTaskId: string): Promise<Task[]>;
}

export class DatabaseStorage implements IStorage {
  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    return db.select().from(workspaces).orderBy(asc(workspaces.order));
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace;
  }

  async createWorkspace(data: InsertWorkspace): Promise<Workspace> {
    const [workspace] = await db.insert(workspaces).values(data).returning();
    return workspace;
  }

  async updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace | undefined> {
    const [workspace] = await db.update(workspaces).set(data).where(eq(workspaces.id, id)).returning();
    return workspace;
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const result = await db.delete(workspaces).where(eq(workspaces.id, id)).returning();
    return result.length > 0;
  }

  // Clients
  async getClients(workspaceId: string): Promise<Client[]> {
    return db.select().from(clients).where(eq(clients.workspaceId, workspaceId));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(data: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(data).returning();
    return client;
  }

  async updateClient(id: string, data: Partial<Client>): Promise<Client | undefined> {
    const [client] = await db.update(clients).set(data).where(eq(clients.id, id)).returning();
    return client;
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id)).returning();
    return result.length > 0;
  }

  // Projects
  async getProjects(workspaceId: string): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.workspaceId, workspaceId));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(data: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(data).returning();
    return project;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project | undefined> {
    const [project] = await db.update(projects).set(data).where(eq(projects.id, id)).returning();
    return project;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  // Task Statuses
  async getTaskStatuses(workspaceId: string): Promise<TaskStatus[]> {
    return db.select().from(taskStatuses)
      .where(eq(taskStatuses.workspaceId, workspaceId))
      .orderBy(asc(taskStatuses.order));
  }

  async getTaskStatus(id: string): Promise<TaskStatus | undefined> {
    const [status] = await db.select().from(taskStatuses).where(eq(taskStatuses.id, id));
    return status;
  }

  async createTaskStatus(data: InsertTaskStatus): Promise<TaskStatus> {
    const [status] = await db.insert(taskStatuses).values(data).returning();
    return status;
  }

  async updateTaskStatus(id: string, data: Partial<TaskStatus>): Promise<TaskStatus | undefined> {
    const [status] = await db.update(taskStatuses).set(data).where(eq(taskStatuses.id, id)).returning();
    return status;
  }

  async deleteTaskStatus(id: string): Promise<boolean> {
    const result = await db.delete(taskStatuses).where(eq(taskStatuses.id, id)).returning();
    return result.length > 0;
  }

  async reorderTaskStatuses(workspaceId: string, statusIds: string[]): Promise<boolean> {
    try {
      // Update the order of each status
      for (let i = 0; i < statusIds.length; i++) {
        await db.update(taskStatuses)
          .set({ order: i })
          .where(and(
            eq(taskStatuses.id, statusIds[i]),
            eq(taskStatuses.workspaceId, workspaceId)
          ));
      }
      return true;
    } catch {
      return false;
    }
  }

  // Tasks
  async getTasks(workspaceId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.workspaceId, workspaceId)).orderBy(asc(tasks.order));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(data: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
    return task;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  // Quick Todos
  async getQuickTodos(workspaceId: string) {
    return db.select().from(quickTodos).where(eq(quickTodos.workspaceId, workspaceId));
  }

  async createQuickTodo(data: InsertQuickTodo) {
    const [todo] = await db.insert(quickTodos).values(data).returning();
    return todo;
  }

  async deleteQuickTodo(id: string) {
    await db.delete(quickTodos).where(eq(quickTodos.id, id));
    return true;
  }

  async toggleQuickTodo(id: string) {
    const [todo] = await db.select().from(quickTodos).where(eq(quickTodos.id, id));
    if (!todo) return null;

    const [updated] = await db
      .update(quickTodos)
      .set({ completed: !todo.completed })
      .where(eq(quickTodos.id, id))
      .returning();
    return updated;
  }

  // Google OAuth Credentials
  async getGoogleOAuthCredentials(workspaceId: string) {
    const [credentials] = await db
      .select()
      .from(googleOAuthSettings)
      .where(eq(googleOAuthSettings.workspaceId, workspaceId))
      .limit(1);
    return credentials;
  }

  async saveGoogleOAuthCredentials(workspaceId: string, clientId: string, clientSecret: string) {
    const existing = await this.getGoogleOAuthCredentials(workspaceId);

    if (existing) {
      // Update
      const [updated] = await db
        .update(googleOAuthSettings)
        .set({ clientId, clientSecret, updatedAt: new Date() })
        .where(eq(googleOAuthSettings.workspaceId, workspaceId))
        .returning();
      return updated;
    } else {
      // Create
      const [created] = await db
        .insert(googleOAuthSettings)
        .values({
          id: crypto.randomUUID(),
          workspaceId,
          clientId,
          clientSecret,
        })
        .returning();
      return created;
    }
  }

  async deleteGoogleOAuthCredentials(workspaceId: string) {
    await db
      .delete(googleOAuthSettings)
      .where(eq(googleOAuthSettings.workspaceId, workspaceId));
    return true;
  }

  // Time Entries
  async getTimeEntries(workspaceId: string): Promise<TimeEntry[]> {
    return db.select().from(timeEntries)
      .where(eq(timeEntries.workspaceId, workspaceId))
      .orderBy(desc(timeEntries.startTime));
  }

  async getTimeEntry(id: string): Promise<TimeEntry | undefined> {
    const [entry] = await db.select().from(timeEntries).where(eq(timeEntries.id, id));
    return entry;
  }

  async getActiveTimeEntry(workspaceId: string): Promise<TimeEntry | undefined> {
    const [entry] = await db.select().from(timeEntries)
      .where(and(
        eq(timeEntries.workspaceId, workspaceId),
        sql`${timeEntries.endTime} IS NULL`
      ));
    return entry;
  }

  async createTimeEntry(data: InsertTimeEntry): Promise<TimeEntry> {
    const [entry] = await db.insert(timeEntries).values(data).returning();
    return entry;
  }

  async updateTimeEntry(id: string, data: Partial<TimeEntry>): Promise<TimeEntry | undefined> {
    const [entry] = await db.update(timeEntries).set(data).where(eq(timeEntries.id, id)).returning();
    return entry;
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    const result = await db.delete(timeEntries).where(eq(timeEntries.id, id)).returning();
    return result.length > 0;
  }

  // Habits
  async getHabits(workspaceId: string): Promise<Habit[]> {
    return db.select().from(habits).where(eq(habits.workspaceId, workspaceId));
  }

  async getHabit(id: string): Promise<Habit | undefined> {
    const [habit] = await db.select().from(habits).where(eq(habits.id, id));
    return habit;
  }

  async createHabit(data: InsertHabit): Promise<Habit> {
    const [habit] = await db.insert(habits).values(data).returning();
    return habit;
  }

  async updateHabit(id: string, data: Partial<Habit>): Promise<Habit | undefined> {
    const [habit] = await db.update(habits).set(data).where(eq(habits.id, id)).returning();
    return habit;
  }

  async deleteHabit(id: string): Promise<boolean> {
    const result = await db.delete(habits).where(eq(habits.id, id)).returning();
    return result.length > 0;
  }

  // Habit Completions
  async getHabitCompletions(workspaceId: string): Promise<HabitCompletion[]> {
    const workspaceHabits = await this.getHabits(workspaceId);
    const habitIds = workspaceHabits.map(h => h.id);

    if (habitIds.length === 0) return [];

    const thirtyDaysAgo = subDays(new Date(), 30);
    return db.select().from(habitCompletions)
      .where(gte(habitCompletions.date, thirtyDaysAgo));
  }

  async createHabitCompletion(data: InsertHabitCompletion): Promise<HabitCompletion> {
    const [completion] = await db.insert(habitCompletions).values(data).returning();

    // Update habit streak
    const habit = await this.getHabit(data.habitId);
    if (habit) {
      const newStreak = habit.currentStreak + 1;
      const longestStreak = Math.max(newStreak, habit.longestStreak);
      await this.updateHabit(habit.id, {
        currentStreak: newStreak,
        longestStreak
      });
    }

    return completion;
  }

  async deleteHabitCompletion(id: string): Promise<boolean> {
    const result = await db.delete(habitCompletions).where(eq(habitCompletions.id, id)).returning();
    return result.length > 0;
  }

  // Diary Entries
  async getDiaryEntries(workspaceId: string): Promise<DiaryEntry[]> {
    if (workspaceId) {
      return db.select().from(diaryEntries)
        .where(eq(diaryEntries.workspaceId, workspaceId))
        .orderBy(desc(diaryEntries.date));
    }
    return db.select().from(diaryEntries).orderBy(desc(diaryEntries.date));
  }

  async getDiaryEntry(id: string): Promise<DiaryEntry | undefined> {
    const [entry] = await db.select().from(diaryEntries).where(eq(diaryEntries.id, id));
    return entry;
  }

  async getDiaryEntryByDate(workspaceId: string, date: Date): Promise<DiaryEntry | undefined> {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const [entry] = await db.select().from(diaryEntries)
      .where(and(
        workspaceId ? eq(diaryEntries.workspaceId, workspaceId) : sql`TRUE`,
        gte(diaryEntries.date, dayStart),
        lte(diaryEntries.date, dayEnd)
      ));
    return entry;
  }

  async createDiaryEntry(data: InsertDiaryEntry): Promise<DiaryEntry> {
    const [entry] = await db.insert(diaryEntries).values(data).returning();
    return entry;
  }

  async updateDiaryEntry(id: string, data: Partial<DiaryEntry>): Promise<DiaryEntry | undefined> {
    const [entry] = await db.update(diaryEntries).set(data).where(eq(diaryEntries.id, id)).returning();
    return entry;
  }

  async deleteDiaryEntry(id: string): Promise<boolean> {
    const result = await db.delete(diaryEntries).where(eq(diaryEntries.id, id)).returning();
    return result.length > 0;
  }

  // Notes
  async getNotes(workspaceId: string): Promise<Note[]> {
    if (workspaceId) {
      return db.select().from(notes).where(eq(notes.workspaceId, workspaceId));
    }
    return db.select().from(notes);
  }

  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async createNote(data: InsertNote): Promise<Note> {
    const [note] = await db.insert(notes).values(data).returning();
    return note;
  }

  async updateNote(id: string, data: Partial<Note>): Promise<Note | undefined> {
    const [note] = await db.update(notes).set(data).where(eq(notes.id, id)).returning();
    return note;
  }

  async deleteNote(id: string): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id)).returning();
    return result.length > 0;
  }

  // Events
  async getEvents(workspaceId: string): Promise<Event[]> {
    if (workspaceId) {
      return db.select().from(events)
        .where(eq(events.workspaceId, workspaceId))
        .orderBy(asc(events.startTime));
    }
    return db.select().from(events).orderBy(asc(events.startTime));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEventByGoogleId(googleEventId: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.googleEventId, googleEventId));
    return event;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async updateEvent(id: string, data: Partial<Event>): Promise<Event | undefined> {
    const [event] = await db.update(events).set(data).where(eq(events.id, id)).returning();
    return event;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }

  // User Settings
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async updateUserSettings(userId: string, data: Partial<UserSettings>): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    if (existing) {
      const [updated] = await db.update(userSettings).set(data).where(eq(userSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(userSettings).values({ ...data, userId } as InsertUserSettings).returning();
    return created;
  }

  // Google Calendar Tokens
  async getGoogleCalendarTokens(userId: string): Promise<GoogleCalendarTokens | undefined> {
    const [tokens] = await db.select().from(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId));
    return tokens;
  }

  async getAllGoogleCalendarTokens(): Promise<GoogleCalendarTokens[]> {
    return db.select().from(googleCalendarTokens);
  }

  async saveGoogleCalendarTokens(data: InsertGoogleCalendarTokens): Promise<GoogleCalendarTokens> {
    const existing = await this.getGoogleCalendarTokens(data.userId);
    if (existing) {
      const [updated] = await db
        .update(googleCalendarTokens)
        .set({
          accessToken: data.accessToken,
          // Only update refresh token if we got a new one
          refreshToken: data.refreshToken || existing.refreshToken,
          expiryDate: data.expiryDate,
          updatedAt: new Date(),
        })
        .where(eq(googleCalendarTokens.userId, data.userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(googleCalendarTokens).values(data).returning();
    return created;
  }

  async deleteGoogleCalendarTokens(userId: string): Promise<boolean> {
    const result = await db.delete(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId)).returning();
    return result.length > 0;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByUsernameOrEmail(identifier: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      or(
        eq(users.username, identifier),
        eq(users.email, identifier)
      )
    );
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  // Payments
  async getPayments(workspaceId: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.workspaceId, workspaceId)).orderBy(desc(payments.paymentDate));
  }

  async createPayment(data: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(data).returning();
    return payment;
  }

  async updatePayment(id: string, data: Partial<Payment>): Promise<Payment | undefined> {
    const [payment] = await db.update(payments).set(data).where(eq(payments.id, id)).returning();
    return payment;
  }

  // Expenses
  async getExpenses(workspaceId: string): Promise<Expense[]> {
    return db.select().from(expenses).where(eq(expenses.workspaceId, workspaceId)).orderBy(desc(expenses.expenseDate));
  }

  async createExpense(data: InsertExpense): Promise<Expense> {
    const [expense] = await db.insert(expenses).values(data).returning();
    return expense;
  }

  async updateExpense(id: string, data: Partial<Expense>): Promise<Expense | undefined> {
    const [expense] = await db.update(expenses).set(data).where(eq(expenses.id, id)).returning();
    return expense;
  }

  async deletePayment(id: string): Promise<boolean> {
    const result = await db.delete(payments).where(eq(payments.id, id));
    return true;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id));
    return true;
  }

  // Push Subscriptions
  async getPushSubscription(userId: string): Promise<PushSubscription | undefined> {
    const [sub] = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    return sub;
  }

  // Get ALL subscriptions for a user (multi-device support)
  async getAllPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async savePushSubscription(data: InsertPushSubscription): Promise<PushSubscription> {
    // Upsert by endpoint - allows multiple devices per user
    // First check if this exact endpoint already exists
    const [existing] = await db.select().from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, data.endpoint));

    if (existing) {
      // Update existing subscription
      const [updated] = await db.update(pushSubscriptions)
        .set({ keys: data.keys, userId: data.userId })
        .where(eq(pushSubscriptions.endpoint, data.endpoint))
        .returning();
      return updated;
    }

    const [sub] = await db.insert(pushSubscriptions).values(data).returning();
    return sub;
  }

  // Milestones
  async getMilestones(projectId: string): Promise<Milestone[]> {
    return db.select().from(milestones)
      .where(eq(milestones.projectId, projectId))
      .orderBy(asc(milestones.order));
  }

  async getMilestone(id: string): Promise<Milestone | undefined> {
    const [milestone] = await db.select().from(milestones).where(eq(milestones.id, id));
    return milestone;
  }

  async createMilestone(data: InsertMilestone): Promise<Milestone> {
    const [milestone] = await db.insert(milestones).values(data).returning();
    return milestone;
  }

  async updateMilestone(id: string, data: Partial<Milestone>): Promise<Milestone | undefined> {
    const [milestone] = await db.update(milestones).set(data).where(eq(milestones.id, id)).returning();
    return milestone;
  }

  async deleteMilestone(id: string): Promise<boolean> {
    const result = await db.delete(milestones).where(eq(milestones.id, id)).returning();
    return result.length > 0;
  }

  // Project Notes
  async getProjectNotes(projectId: string): Promise<ProjectNote[]> {
    return db.select().from(projectNotes)
      .where(eq(projectNotes.projectId, projectId))
      .orderBy(desc(projectNotes.createdAt));
  }

  async createProjectNote(data: InsertProjectNote): Promise<ProjectNote> {
    const [note] = await db.insert(projectNotes).values(data).returning();
    return note;
  }

  async deleteProjectNote(id: string): Promise<boolean> {
    const result = await db.delete(projectNotes).where(eq(projectNotes.id, id)).returning();
    return result.length > 0;
  }

  // Project Todos
  async getProjectTodos(projectId: string): Promise<ProjectTodo[]> {
    return db.select().from(projectTodos)
      .where(eq(projectTodos.projectId, projectId))
      .orderBy(asc(projectTodos.order));
  }

  async createProjectTodo(data: InsertProjectTodo): Promise<ProjectTodo> {
    const [todo] = await db.insert(projectTodos).values(data).returning();
    return todo;
  }

  async updateProjectTodo(id: string, data: Partial<ProjectTodo>): Promise<ProjectTodo | undefined> {
    const [todo] = await db.update(projectTodos).set(data).where(eq(projectTodos.id, id)).returning();
    return todo;
  }

  async deleteProjectTodo(id: string): Promise<boolean> {
    const result = await db.delete(projectTodos).where(eq(projectTodos.id, id)).returning();
    return result.length > 0;
  }

  // Subtasks - get all subtasks for a parent task
  async getSubtasks(parentTaskId: string): Promise<Task[]> {
    return db.select().from(tasks)
      .where(eq(tasks.parentTaskId, parentTaskId))
      .orderBy(asc(tasks.order));
  }

  // Reminder methods - get items due for notification
  async getUpcomingEvents(defaultMinutes: number): Promise<Event[]> {
    const now = new Date();
    // Get events that have reminderMinutes set and haven't had reminder sent yet
    // Event should start within (reminderMinutes) from now
    const allEvents = await db.select().from(events)
      .where(
        and(
          eq(events.reminderSent, false),
          gte(events.startTime, now)
        )
      );

    // Filter events where the reminder should fire now
    return allEvents.filter(event => {
      const reminderMins = event.reminderMinutes ?? defaultMinutes;
      const reminderTime = addMinutes(now, reminderMins);
      return event.startTime <= reminderTime;
    });
  }

  async getDueTasks(defaultMinutes: number): Promise<Task[]> {
    const now = new Date();
    // Get ALL tasks that haven't had reminder 1 sent and have a startDate
    const allTasks = await db.select().from(tasks)
      .where(
        and(
          eq(tasks.reminderSent, false),
          sql`${tasks.startDate} IS NOT NULL`,
          sql`${tasks.reminderMinutes} IS NOT NULL`
        )
      );

    console.log(`[Storage] getDueTasks: Found ${allTasks.length} tasks with reminderSent=false and startDate set`);

    // Filter tasks where the START time is within the reminder window
    // i.e., startDate is between now and (now + reminderMinutes)
    return allTasks.filter(task => {
      if (!task.startDate || !task.reminderMinutes) return false;
      const startDate = new Date(task.startDate);
      const reminderMins = task.reminderMinutes;
      const reminderTime = addMinutes(now, reminderMins);

      // Task should fire if startDate is in the future but within reminderMinutes from now
      const shouldFire = startDate > now && startDate <= reminderTime;
      if (shouldFire) {
        console.log(`[Storage] Task "${task.title}" qualifies: starts at ${startDate.toISOString()}, reminder window ends at ${reminderTime.toISOString()}`);
      }
      return shouldFire;
    });
  }

  async getDueTasks2(defaultMinutes: number): Promise<Task[]> {
    const now = new Date();
    // Get ALL tasks that haven't had reminder 2 sent and have a dueDate
    const allTasks = await db.select().from(tasks)
      .where(
        and(
          eq(tasks.reminder2Sent, false),
          sql`${tasks.dueDate} IS NOT NULL`,
          sql`${tasks.reminder2Minutes} IS NOT NULL`
        )
      );

    console.log(`[Storage] getDueTasks2: Found ${allTasks.length} tasks with reminder2Sent=false and dueDate set`);

    // Filter tasks where the DUE time is within the reminder window
    return allTasks.filter(task => {
      if (!task.dueDate || !task.reminder2Minutes) return false;
      const dueDate = new Date(task.dueDate);
      const reminderMins = task.reminder2Minutes;
      const reminderTime = addMinutes(now, reminderMins);

      // Task should fire if dueDate is in the future but within reminder2Minutes from now
      const shouldFire = dueDate > now && dueDate <= reminderTime;
      if (shouldFire) {
        console.log(`[Storage] Task "${task.title}" deadline qualifies: due at ${dueDate.toISOString()}, reminder window ends at ${reminderTime.toISOString()}`);
      }
      return shouldFire;
    });
  }

  async markEventReminderSent(id: string): Promise<void> {
    await db.update(events).set({ reminderSent: true }).where(eq(events.id, id));
  }

  async markTaskReminderSent(id: string): Promise<void> {
    await db.update(tasks).set({ reminderSent: true }).where(eq(tasks.id, id));
  }

  async markTaskReminder2Sent(id: string): Promise<void> {
    await db.update(tasks).set({ reminder2Sent: true }).where(eq(tasks.id, id));
  }

  // Notification Logs
  async createNotificationLog(data: InsertNotificationLog): Promise<NotificationLog> {
    const [log] = await db.insert(notificationLogs).values(data).returning();
    return log;
  }

  async getNotificationLogs(userId: string, limit: number = 50): Promise<NotificationLog[]> {
    return db.select().from(notificationLogs)
      .where(eq(notificationLogs.userId, userId))
      .orderBy(desc(notificationLogs.sentAt))
      .limit(limit);
  }

  async clearNotificationLogs(userId: string): Promise<void> {
    await db.delete(notificationLogs).where(eq(notificationLogs.userId, userId));
  }

  async getAllTasksWithPendingReminders(): Promise<Task[]> {
    const now = new Date();
    // Get tasks with future start/due dates where reminders haven't been sent
    return db.select().from(tasks)
      .where(
        or(
          and(
            eq(tasks.reminderSent, false),
            sql`${tasks.startDate} IS NOT NULL`,
            sql`${tasks.reminderMinutes} IS NOT NULL`,
            gte(tasks.startDate, now)
          ),
          and(
            eq(tasks.reminder2Sent, false),
            sql`${tasks.dueDate} IS NOT NULL`,
            sql`${tasks.reminder2Minutes} IS NOT NULL`,
            gte(tasks.dueDate, now)
          )
        )
      );
  }

  async getAllEventsWithPendingReminders(): Promise<Event[]> {
    const now = new Date();
    return db.select().from(events)
      .where(
        and(
          eq(events.reminderSent, false),
          gte(events.startTime, now)
        )
      );
  }
}

export const storage = new DatabaseStorage();
