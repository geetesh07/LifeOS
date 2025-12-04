import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/lib/workspace-context";
import { eachDayOfInterval, subDays, format, isSameDay, startOfDay } from "date-fns";
import type { TimeEntry, Task } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ActivityGraph() {
    const { currentWorkspace } = useWorkspace();
    const today = new Date();
    const yearAgo = subDays(today, 364); // Show last 365 days (approx)

    // Fetch data
    const { data: timeEntries } = useQuery<TimeEntry[]>({
        queryKey: [`/api/time-entries?workspaceId=${currentWorkspace?.id}`],
        enabled: !!currentWorkspace,
    });

    const { data: tasks } = useQuery<Task[]>({
        queryKey: [`/api/tasks?workspaceId=${currentWorkspace?.id}`],
        enabled: !!currentWorkspace,
    });

    // Generate days array
    const days = eachDayOfInterval({ start: yearAgo, end: today });

    // Calculate activity level for each day
    const getActivityLevel = (date: Date) => {
        if (!timeEntries && !tasks) return 0;

        let score = 0;

        // Points for time entries
        const dayEntries = timeEntries?.filter(e => isSameDay(new Date(e.startTime), date)) || [];
        score += dayEntries.length * 2;
        const minutesTracked = dayEntries.reduce((acc, e) => acc + (e.durationMinutes || 0), 0);
        score += Math.floor(minutesTracked / 30); // 1 point per 30 mins

        // Points for completed tasks
        const dayTasks = tasks?.filter(t => t.completedAt && isSameDay(new Date(t.completedAt), date)) || [];
        score += dayTasks.length * 5;

        if (score === 0) return 0;
        if (score <= 5) return 1;
        if (score <= 15) return 2;
        if (score <= 30) return 3;
        return 4;
    };

    // Color map for activity levels
    const getLevelColor = (level: number) => {
        switch (level) {
            case 0: return "bg-muted/40";
            case 1: return "bg-primary/30";
            case 2: return "bg-primary/50";
            case 3: return "bg-primary/70";
            case 4: return "bg-primary";
            default: return "bg-muted/40";
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    Activity
                    <span className="text-xs font-normal text-muted-foreground ml-auto">Last 365 days</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-1 justify-end">
                    <TooltipProvider>
                        {days.map((day, i) => {
                            const level = getActivityLevel(day);
                            return (
                                <Tooltip key={day.toISOString()}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`w-3 h-3 rounded-sm ${getLevelColor(level)} transition-colors hover:ring-1 hover:ring-ring`}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs">
                                            {format(day, "MMM d, yyyy")}
                                        </p>
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
                        <div className="w-3 h-3 rounded-sm bg-primary/30" />
                        <div className="w-3 h-3 rounded-sm bg-primary/50" />
                        <div className="w-3 h-3 rounded-sm bg-primary/70" />
                        <div className="w-3 h-3 rounded-sm bg-primary" />
                    </div>
                    <span>More</span>
                </div>
            </CardContent>
        </Card>
    );
}
