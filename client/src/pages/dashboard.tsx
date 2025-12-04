import { ActivityGraph } from "@/components/activity-graph";

// ... (existing imports)

// Inside Dashboard component return:
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  CheckSquare,
  Clock,
  Target,
  ArrowRight,
  Flame,
  Calendar,
  TrendingUp,
  Zap,
  ChevronRight,
  Play,
} from "lucide-react";
import { Link } from "wouter";
import { useWorkspace } from "@/lib/workspace-context";
import { getDailyQuote } from "@/lib/quotes";
import { format, isToday, isTomorrow, parseISO, startOfDay } from "date-fns";
import type { Task, Habit, TimeEntry, Event } from "@shared/schema";
import { useQuery } from "@tanstack/react-query"; // Assuming this import was missing and needed for useQuery

function QuoteCard() {
  const quote = getDailyQuote();

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <blockquote className="text-lg font-medium italic leading-relaxed" data-testid="text-daily-quote">
              "{quote.text}"
            </blockquote>
            <p className="text-sm text-muted-foreground mt-2">— {quote.author}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCards({
  tasks,
  habits,
  timeEntries
}: {
  tasks: Task[] | undefined;
  habits: Habit[] | undefined;
  timeEntries: TimeEntry[] | undefined;
}) {
  const todayTasks = tasks?.filter(t =>
    t.dueDate && isToday(new Date(t.dueDate)) && t.status !== "done"
  ).length || 0;

  const completedToday = tasks?.filter(t =>
    t.completedAt && isToday(new Date(t.completedAt))
  ).length || 0;

  const todayMinutes = timeEntries?.filter(e =>
    isToday(new Date(e.startTime))
  ).reduce((acc, e) => acc + (e.durationMinutes || 0), 0) || 0;

  const totalStreak = habits?.reduce((acc, h) => acc + h.currentStreak, 0) || 0;

  const stats = [
    {
      title: "Tasks Due Today",
      value: todayTasks,
      icon: CheckSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Completed Today",
      value: completedToday,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Time Tracked",
      value: `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`,
      icon: Clock,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Habit Streak",
      value: totalStreak,
      icon: Flame,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover-elevate transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-1" data-testid={`stat-${stat.title.toLowerCase().replace(/ /g, "-")}`}>
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

function UpcomingTasks({ tasks }: { tasks: Task[] | undefined }) {
  const { workspaces } = useWorkspace();

  const upcomingTasks = tasks
    ?.filter(t => t.status !== "done" && t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      default: return "bg-slate-400";
    }
  };

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const getWorkspaceName = (workspaceId: string) => {
    return workspaces?.find(w => w.id === workspaceId)?.name || "Unknown";
  };

  const getWorkspaceColor = (workspaceId: string) => {
    return workspaces?.find(w => w.id === workspaceId)?.color || "#6B7280";
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Upcoming Tasks</CardTitle>
        <Link href="/tasks">
          <Button variant="ghost" size="sm" data-testid="link-view-all-tasks">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {!upcomingTasks || upcomingTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming tasks</p>
          </div>
        ) : (
          upcomingTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover-elevate transition-all cursor-pointer"
              data-testid={`task-item-${task.id}`}
            >
              <div className={`w-1.5 h-8 rounded-full ${getPriorityColor(task.priority)}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: getWorkspaceColor(task.workspaceId),
                      color: getWorkspaceColor(task.workspaceId)
                    }}
                  >
                    {getWorkspaceName(task.workspaceId)}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {task.dueDate && formatDueDate(new Date(task.dueDate))}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {task.priority}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function HabitProgress({ habits }: { habits: Habit[] | undefined }) {
  const activeHabits = habits?.filter(h => !h.isArchived).slice(0, 4);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Today's Habits</CardTitle>
        <Link href="/habits">
          <Button variant="ghost" size="sm" data-testid="link-view-all-habits">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {!activeHabits || activeHabits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No habits yet</p>
          </div>
        ) : (
          activeHabits.map((habit) => (
            <div key={habit.id} className="space-y-2" data-testid={`habit-item-${habit.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{ backgroundColor: habit.color + "20" }}
                  >
                    <Target className="h-3.5 w-3.5" style={{ color: habit.color }} />
                  </div>
                  <span className="font-medium text-sm">{habit.name}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">{habit.currentStreak}</span>
                </div>
              </div>
              <Progress value={(habit.currentStreak / Math.max(habit.longestStreak, 7)) * 100} className="h-1.5" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function QuickActions({ workspaceId }: { workspaceId: string | undefined }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Link href="/tasks">
          <Button variant="outline" className="w-full justify-start gap-2" data-testid="quick-action-new-task">
            <CheckSquare className="h-4 w-4" />
            New Task
          </Button>
        </Link>
        <Link href="/time">
          <Button variant="outline" className="w-full justify-start gap-2" data-testid="quick-action-start-timer">
            <Play className="h-4 w-4" />
            Start Timer
          </Button>
        </Link>
        <Link href="/diary">
          <Button variant="outline" className="w-full justify-start gap-2" data-testid="quick-action-write-diary">
            <Calendar className="h-4 w-4" />
            Write Diary
          </Button>
        </Link>
        <Link href="/notes">
          <Button variant="outline" className="w-full justify-start gap-2" data-testid="quick-action-quick-note">
            <Zap className="h-4 w-4" />
            Quick Note
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function RecentTimeEntries({ timeEntries }: { timeEntries: TimeEntry[] | undefined }) {
  const recentEntries = timeEntries
    ?.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Recent Time Entries</CardTitle>
        <Link href="/time">
          <Button variant="ghost" size="sm" data-testid="link-view-all-time">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {!recentEntries || recentEntries.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No time entries yet</p>
          </div>
        ) : (
          recentEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              data-testid={`time-entry-${entry.id}`}
            >
              <div>
                <p className="font-medium text-sm">{entry.description || "Untitled entry"}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(entry.startTime), "MMM d, h:mm a")}
                </p>
              </div>
              <span className="font-mono text-sm font-medium">
                {entry.durationMinutes
                  ? `${Math.floor(entry.durationMinutes / 60)}h ${entry.durationMinutes % 60}m`
                  : "In progress"
                }
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { currentWorkspace } = useWorkspace();

  // Fetch data from ALL workspaces for unified dashboard
  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/all"],
    queryFn: async () => {
      const workspaces = await fetch("/api/workspaces").then(r => r.json());
      const allTasks = await Promise.all(
        workspaces.map((ws: any) =>
          fetch(`/api/tasks?workspaceId=${ws.id}`).then(r => r.json())
        )
      );
      return allTasks.flat();
    },
  });

  const { data: habits, isLoading: habitsLoading } = useQuery<Habit[]>({
    queryFn: async () => {
      const workspaces = await fetch("/api/workspaces").then(r => r.json());
      const allHabits = await Promise.all(
        workspaces.map((ws: any) =>
          fetch(`/api/habits?workspaceId=${ws.id}`).then(r => r.json())
        )
      );
      return allHabits.flat();
    },
    queryKey: ["/api/habits/all"],
  });

  const { data: timeEntries, isLoading: timeLoading } = useQuery<TimeEntry[]>({
    queryFn: async () => {
      const workspaces = await fetch("/api/workspaces").then(r => r.json());
      const allEntries = await Promise.all(
        workspaces.map((ws: any) =>
          fetch(`/api/time-entries?workspaceId=${ws.id}`).then(r => r.json())
        )
      );
      return allEntries.flat();
    },
    queryKey: ["/api/time-entries/all"],
  });

  const today = new Date();
  const greeting = () => {
    const hour = today.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const isLoading = tasksLoading || habitsLoading || timeLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-greeting">
            {greeting()}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(today, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        {currentWorkspace && (
          <Badge
            variant="outline"
            className="self-start md:self-auto px-3 py-1.5"
            style={{
              borderColor: currentWorkspace.color,
              backgroundColor: currentWorkspace.color + "10",
              color: currentWorkspace.color,
            }}
            data-testid="badge-current-workspace"
          >
            {currentWorkspace.name}
          </Badge>
        )}
      </div>

      <QuoteCard />

      {isLoading ? (
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
      ) : (
        <StatsCards tasks={tasks} habits={habits} timeEntries={timeEntries} />
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <UpcomingTasks tasks={tasks} />
        <HabitProgress habits={habits} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <QuickActions workspaceId={currentWorkspace?.id} />
        <RecentTimeEntries timeEntries={timeEntries} />
      </div>

      <ActivityGraph />
    </div>
  );
}
