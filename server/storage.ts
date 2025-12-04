import {
  workspaces, clients, projects, tasks, timeEntries,
  habits, habitCompletions, diaryEntries, notes, events, userSettings,
  taskStatuses,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";
import { startOfDay, endOfDay, subDays } from "date-fns";

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
  createEvent(data: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // User Settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  updateUserSettings(userId: string, data: Partial<UserSettings>): Promise<UserSettings>;
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

  async createEvent(data: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(data).returning();
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
}

export const storage = new DatabaseStorage();
