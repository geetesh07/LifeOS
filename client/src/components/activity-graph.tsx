import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/lib/workspace-context";
import { eachDayOfInterval, subDays, format, isSameDay, startOfDay } from "date-fns";
import type { TimeEntry, Task, Habit, HabitCompletion, DiaryEntry, Note, Event, Client, Project } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity } from "lucide-react";

export function ActivityGraph() {
    const today = new Date();
    const yearAgo = subDays(today, 364);

    // Fetch ALL data across workspaces for comprehensive activity tracking
    const { data: timeEntries } = useQuery<TimeEntry[]>({
        queryKey: ["/api/time-entries/all"],
        queryFn: async () => {
            const workspaces = await fetch("/api/workspaces").then(r => r.json());
            const all = await Promise.all(
                workspaces.map((ws: any) =>
                    fetch(`/api/time-entries?workspaceId=${ws.id}`).then(r => r.json())
                )
            );
            return all.flat();
        },
    });

    const { data: tasks } = useQuery<Task[]>({
        queryKey: ["/api/tasks/all"],
        queryFn: async () => {
            const workspaces = await fetch("/api/workspaces").then(r => r.json());
            const all = await Promise.all(
                workspaces.map((ws: any) =>
                    fetch(`/api/tasks?workspaceId=${ws.id}`).then(r => r.json())
                )
            );
            return all.flat();
        },
    });

    const { data: habitCompletions } = useQuery<HabitCompletion[]>({
        queryKey: ["/api/habit-completions/all"],
        queryFn: async () => {
            const workspaces = await fetch("/api/workspaces").then(r => r.json());
            const all = await Promise.all(
                workspaces.map((ws: any) =>
                    fetch(`/api/habit-completions?workspaceId=${ws.id}`).then(r => r.json())
                )
            );
            return all.flat();
        },
    });

    const { data: diaryEntries } = useQuery<DiaryEntry[]>({
        queryKey: ["/api/diary-entries/all"],
        queryFn: async () => {
            const workspaces = await fetch("/api/workspaces").then(r => r.json());
            const all = await Promise.all(
                workspaces.map((ws: any) =>
                    fetch(`/api/diary-entries?workspaceId=${ws.id}`).then(r => r.json())
                )
            );
            return all.flat();
        },
    });

    const { data: notes } = useQuery<Note[]>({
        queryKey: ["/api/notes/all"],
        queryFn: async () => {
            const workspaces = await fetch("/api/workspaces").then(r => r.json());
            const all = await Promise.all(
                workspaces.map((ws: any) =>
                    fetch(`/api/notes?workspaceId=${ws.id}`).then(r => r.json())
                )
            );
            return all.flat();
        },
    });

    const { data: events } = useQuery<Event[]>({
        queryKey: ["/api/events/all"],
        queryFn: async () => {
            const workspaces = await fetch("/api/workspaces").then(r => r.json());
            const all = await Promise.all(
                workspaces.map((ws: any) =>
                    fetch(`/api/events?workspaceId=${ws.id}`).then(r => r.json())
                )
            );
            return all.flat();
        },
    });

    // Generate days array
    const days = eachDayOfInterval({ start: yearAgo, end: today });

    // Calculate comprehensive activity level for each day
    const getActivityLevel = (date: Date) => {
        let score = 0;
        let activities: string[] = [];

        // Points for time entries (working on things)
        const dayTimeEntries = timeEntries?.filter(e => isSameDay(new Date(e.startTime), date)) || [];
        if (dayTimeEntries.length > 0) {
            score += dayTimeEntries.length * 2;
            const minutesTracked = dayTimeEntries.reduce((acc, e) => acc + (e.durationMinutes || 0), 0);
            score += Math.floor(minutesTracked / 30);
            activities.push(`${dayTimeEntries.length} time entries`);
        }

        // Points for completed tasks
        const dayTasksCompleted = tasks?.filter(t => t.completedAt && isSameDay(new Date(t.completedAt), date)) || [];
        if (dayTasksCompleted.length > 0) {
            score += dayTasksCompleted.length * 5;
            activities.push(`${dayTasksCompleted.length} tasks completed`);
        }

        // Points for tasks created (use dueDate or just skip this category)
        // Note: createdAt doesn't exist on Task type, so we skip tracking task creation

        // Points for habit completions
        const dayHabits = habitCompletions?.filter(h => isSameDay(new Date(h.date), date)) || [];
        if (dayHabits.length > 0) {
            score += dayHabits.length * 3;
            activities.push(`${dayHabits.length} habits done`);
        }

        // Points for diary entries
        const dayDiary = diaryEntries?.filter(d => isSameDay(new Date(d.date), date)) || [];
        if (dayDiary.length > 0) {
            score += dayDiary.length * 4;
            activities.push(`${dayDiary.length} diary entries`);
        }

        // Notes don't have createdAt in schema, skip for now

        // Points for events on this day (use startTime instead of createdAt)
        const dayEvents = events?.filter(e => isSameDay(new Date(e.startTime), date)) || [];
        if (dayEvents.length > 0) {
            score += dayEvents.length * 2;
            activities.push(`${dayEvents.length} events`);
        }

        // Determine level based on score
        let level = 0;
        if (score === 0) level = 0;
        else if (score <= 5) level = 1;
        else if (score <= 15) level = 2;
        else if (score <= 30) level = 3;
        else level = 4;

        return { level, score, activities };
    };

    // Color map for activity levels
    const getLevelColor = (level: number) => {
        switch (level) {
            case 0: return "bg-muted/40";
            case 1: return "bg-emerald-500/30";
            case 2: return "bg-emerald-500/50";
            case 3: return "bg-emerald-500/70";
            case 4: return "bg-emerald-500";
            default: return "bg-muted/40";
        }
    };

    // Calculate total activity stats
    const totalDaysActive = days.filter(d => getActivityLevel(d).level > 0).length;
    const currentStreak = (() => {
        let streak = 0;
        for (let i = days.length - 1; i >= 0; i--) {
            if (getActivityLevel(days[i]).level > 0) streak++;
            else break;
        }
        return streak;
    })();

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Activity
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="text-muted-foreground">
                            <span className="font-semibold text-foreground">{totalDaysActive}</span> days active
                        </div>
                        <div className="text-muted-foreground">
                            <span className="font-semibold text-foreground">{currentStreak}</span> day streak
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-1 justify-end">
                    <TooltipProvider>
                        {days.map((day) => {
                            const { level, score, activities } = getActivityLevel(day);
                            return (
                                <Tooltip key={day.toISOString()}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`w-3 h-3 rounded-sm ${getLevelColor(level)} transition-colors hover:ring-1 hover:ring-ring cursor-pointer`}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="font-medium text-xs">
                                            {format(day, "MMM d, yyyy")}
                                        </p>
                                        {activities.length > 0 ? (
                                            <ul className="text-xs text-muted-foreground mt-1">
                                                {activities.map((a, i) => (
                                                    <li key={i}>• {a}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">No activity</p>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </TooltipProvider>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-muted/40" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-500/30" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-500/50" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-500/70" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                    </div>
                    <span>More</span>
                </div>
            </CardContent>
        </Card>
    );
}
