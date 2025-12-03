import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  Clock,
  CheckSquare,
  Target,
  TrendingUp,
  Calendar,
  Flame,
  PieChart,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { 
  format, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  differenceInDays,
} from "date-fns";
import type { Task, TimeEntry, Habit, HabitCompletion, Project } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

type DateRange = "week" | "month" | "year";

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#6366F1"];

function OverviewStats({
  tasks,
  timeEntries,
  habits,
  completions,
  dateRange,
}: {
  tasks: Task[];
  timeEntries: TimeEntry[];
  habits: Habit[];
  completions: HabitCompletion[];
  dateRange: DateRange;
}) {
  const now = new Date();
  let startDate: Date;
  
  switch (dateRange) {
    case "week":
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      break;
    case "month":
      startDate = startOfMonth(now);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
  }

  const filteredTasks = tasks.filter(t => 
    t.completedAt && new Date(t.completedAt) >= startDate
  );

  const filteredTimeEntries = timeEntries.filter(e => 
    new Date(e.startTime) >= startDate && e.durationMinutes
  );

  const filteredCompletions = completions.filter(c => 
    new Date(c.date) >= startDate
  );

  const totalMinutes = filteredTimeEntries.reduce((acc, e) => acc + (e.durationMinutes || 0), 0);
  const tasksCompleted = filteredTasks.length;
  const habitCompletionsCount = filteredCompletions.length;
  
  const avgDailyMinutes = Math.round(totalMinutes / Math.max(differenceInDays(now, startDate), 1));

  const stats = [
    { 
      label: "Tasks Completed", 
      value: tasksCompleted, 
      icon: CheckSquare, 
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    { 
      label: "Time Tracked", 
      value: formatDuration(totalMinutes), 
      icon: Clock, 
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    { 
      label: "Habit Check-ins", 
      value: habitCompletionsCount, 
      icon: Target, 
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    { 
      label: "Avg. Daily Time", 
      value: formatDuration(avgDailyMinutes), 
      icon: TrendingUp, 
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1" data-testid={`stat-${stat.label.toLowerCase().replace(/ /g, "-")}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TimeByDayChart({
  timeEntries,
  dateRange,
}: {
  timeEntries: TimeEntry[];
  dateRange: DateRange;
}) {
  const now = new Date();
  let days: Date[];
  
  switch (dateRange) {
    case "week":
      days = eachDayOfInterval({ 
        start: startOfWeek(now, { weekStartsOn: 1 }), 
        end: endOfWeek(now, { weekStartsOn: 1 }) 
      });
      break;
    case "month":
      days = eachDayOfInterval({ start: startOfMonth(now), end: now });
      break;
    case "year":
      days = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), i, 1));
      break;
  }

  const data = days.map(day => {
    const dayEntries = dateRange === "year"
      ? timeEntries.filter(e => {
          const d = new Date(e.startTime);
          return d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
        })
      : timeEntries.filter(e => isSameDay(new Date(e.startTime), day));
    
    const minutes = dayEntries.reduce((acc, e) => acc + (e.durationMinutes || 0), 0);
    
    return {
      name: dateRange === "year" ? format(day, "MMM") : format(day, "EEE"),
      hours: Math.round((minutes / 60) * 10) / 10,
      minutes,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Time Tracked by {dateRange === "year" ? "Month" : "Day"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', className: 'fill-muted-foreground' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDuration(payload[0].payload.minutes)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function TimeByProjectChart({
  timeEntries,
  projects,
}: {
  timeEntries: TimeEntry[];
  projects: Project[];
}) {
  const projectTime = timeEntries.reduce((acc, entry) => {
    const projectId = entry.projectId || "no-project";
    acc[projectId] = (acc[projectId] || 0) + (entry.durationMinutes || 0);
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(projectTime)
    .map(([projectId, minutes]) => {
      const project = projects.find(p => p.id === projectId);
      return {
        name: project?.name || "No Project",
        value: minutes,
        color: project?.color || "#6B7280",
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Time by Project
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No time entries yet
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const percent = ((payload[0].value as number) / total * 100).toFixed(1);
                      return (
                        <div className="bg-popover border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{payload[0].name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDuration(payload[0].value as number)} ({percent}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  formatter={(value: string) => (
                    <span className="text-sm">{value}</span>
                  )}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskCompletionChart({
  tasks,
  dateRange,
}: {
  tasks: Task[];
  dateRange: DateRange;
}) {
  const now = new Date();
  let days: Date[];
  
  switch (dateRange) {
    case "week":
      days = eachDayOfInterval({ 
        start: startOfWeek(now, { weekStartsOn: 1 }), 
        end: endOfWeek(now, { weekStartsOn: 1 }) 
      });
      break;
    case "month":
      days = eachDayOfInterval({ start: startOfMonth(now), end: now });
      break;
    case "year":
      days = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), i, 1));
      break;
  }

  const data = days.map(day => {
    const completedTasks = dateRange === "year"
      ? tasks.filter(t => {
          if (!t.completedAt) return false;
          const d = new Date(t.completedAt);
          return d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
        })
      : tasks.filter(t => t.completedAt && isSameDay(new Date(t.completedAt), day));
    
    return {
      name: dateRange === "year" ? format(day, "MMM") : format(day, "EEE"),
      completed: completedTasks.length,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Task Completions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">
                          {payload[0].value} tasks completed
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function HabitStreaksSummary({ habits }: { habits: Habit[] }) {
  const sortedHabits = [...habits]
    .filter(h => !h.isArchived)
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Flame className="h-5 w-5" />
          Top Habit Streaks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedHabits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No habits yet
          </div>
        ) : (
          sortedHabits.map((habit, index) => (
            <div key={habit.id} className="flex items-center gap-3">
              <span className="text-lg font-bold text-muted-foreground w-6">
                #{index + 1}
              </span>
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: habit.color + "20" }}
              >
                <Target className="h-4 w-4" style={{ color: habit.color }} />
              </div>
              <div className="flex-1">
                <p className="font-medium">{habit.name}</p>
                <p className="text-sm text-muted-foreground">
                  Best: {habit.longestStreak} days
                </p>
              </div>
              <Badge className="gap-1 font-mono">
                <Flame className="h-3 w-3" />
                {habit.currentStreak}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const { currentWorkspace } = useWorkspace();
  const [dateRange, setDateRange] = useState<DateRange>("week");

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", currentWorkspace?.id],
    enabled: !!currentWorkspace,
  });

  const { data: timeEntries, isLoading: timeLoading } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries", currentWorkspace?.id],
    enabled: !!currentWorkspace,
  });

  const { data: habits } = useQuery<Habit[]>({
    queryKey: ["/api/habits", currentWorkspace?.id],
    enabled: !!currentWorkspace,
  });

  const { data: completions } = useQuery<HabitCompletion[]>({
    queryKey: ["/api/habit-completions", currentWorkspace?.id],
    enabled: !!currentWorkspace,
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects", currentWorkspace?.id],
    enabled: !!currentWorkspace,
  });

  const isLoading = tasksLoading || timeLoading;

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Select a workspace to view reports</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Insights into your productivity
          </p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-[140px]" data-testid="select-date-range">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-[380px]" />
            <Skeleton className="h-[380px]" />
          </div>
        </div>
      ) : (
        <>
          <OverviewStats
            tasks={tasks || []}
            timeEntries={timeEntries || []}
            habits={habits || []}
            completions={completions || []}
            dateRange={dateRange}
          />

          <div className="grid lg:grid-cols-2 gap-6">
            <TimeByDayChart timeEntries={timeEntries || []} dateRange={dateRange} />
            <TimeByProjectChart timeEntries={timeEntries || []} projects={projects || []} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <TaskCompletionChart tasks={tasks || []} dateRange={dateRange} />
            <HabitStreaksSummary habits={habits || []} />
          </div>
        </>
      )}
    </div>
  );
}
