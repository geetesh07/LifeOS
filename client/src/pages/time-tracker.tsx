import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Play, 
  Pause, 
  Square, 
  Clock,
  MoreHorizontal,
  Trash2,
  Edit,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/lib/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, formatDistanceToNow, differenceInMinutes, isToday, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import type { TimeEntry, Project, Task, InsertTimeEntry } from "@shared/schema";

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function formatDurationLong(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function Timer({ 
  workspaceId,
  projects,
  tasks,
  activeEntry,
  onStop,
}: {
  workspaceId: string;
  projects: Project[];
  tasks: Task[];
  activeEntry: TimeEntry | null;
  onStop: () => void;
}) {
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [taskId, setTaskId] = useState<string>("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeEntry) {
      const start = new Date(activeEntry.startTime).getTime();
      const updateElapsed = () => {
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - start) / 1000));
      };
      updateElapsed();
      intervalRef.current = setInterval(updateElapsed, 1000);
      setDescription(activeEntry.description || "");
      setProjectId(activeEntry.projectId || "");
      setTaskId(activeEntry.taskId || "");
    } else {
      setElapsedSeconds(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeEntry]);

  const startMutation = useMutation({
    mutationFn: async (data: InsertTimeEntry) => {
      return apiRequest("POST", "/api/time-entries", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Timer started" });
    },
    onError: () => {
      toast({ title: "Failed to start timer", variant: "destructive" });
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      if (!activeEntry) return;
      const endTime = new Date();
      const durationMinutes = differenceInMinutes(endTime, new Date(activeEntry.startTime));
      return apiRequest("PATCH", `/api/time-entries/${activeEntry.id}`, {
        endTime,
        durationMinutes,
        description: description || null,
        projectId: projectId || null,
        taskId: taskId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Time entry saved" });
      setDescription("");
      setProjectId("");
      setTaskId("");
      onStop();
    },
    onError: () => {
      toast({ title: "Failed to stop timer", variant: "destructive" });
    },
  });

  const handleStart = () => {
    startMutation.mutate({
      workspaceId,
      startTime: new Date(),
      description: description || null,
      projectId: projectId || null,
      taskId: taskId || null,
    });
  };

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const filteredTasks = projectId 
    ? tasks.filter(t => t.projectId === projectId)
    : tasks;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="flex-shrink-0 text-center">
            <div 
              className="font-mono text-5xl lg:text-6xl font-bold tracking-wider"
              data-testid="timer-display"
            >
              {hours.toString().padStart(2, "0")}:
              {minutes.toString().padStart(2, "0")}:
              {seconds.toString().padStart(2, "0")}
            </div>
            {activeEntry && (
              <p className="text-sm text-muted-foreground mt-2">
                Started {formatDistanceToNow(new Date(activeEntry.startTime))} ago
              </p>
            )}
          </div>

          <div className="flex-1 w-full space-y-4">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              className="text-lg"
              disabled={!!activeEntry}
              data-testid="input-timer-description"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select value={projectId} onValueChange={setProjectId} disabled={!!activeEntry}>
                <SelectTrigger data-testid="select-timer-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={taskId} onValueChange={setTaskId} disabled={!!activeEntry}>
                <SelectTrigger data-testid="select-timer-task">
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No task</SelectItem>
                  {filteredTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-shrink-0">
            {activeEntry ? (
              <Button 
                size="lg" 
                variant="destructive"
                className="w-16 h-16 rounded-full"
                onClick={() => stopMutation.mutate()}
                disabled={stopMutation.isPending}
                data-testid="button-stop-timer"
              >
                <Square className="h-6 w-6" />
              </Button>
            ) : (
              <Button 
                size="lg"
                className="w-16 h-16 rounded-full"
                onClick={handleStart}
                disabled={startMutation.isPending}
                data-testid="button-start-timer"
              >
                <Play className="h-6 w-6 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyStats({ timeEntries }: { timeEntries: TimeEntry[] }) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const dailyTotals = weekDays.map(day => {
    const dayEntries = timeEntries.filter(e => 
      e.durationMinutes && isSameDay(new Date(e.startTime), day)
    );
    return {
      day,
      minutes: dayEntries.reduce((acc, e) => acc + (e.durationMinutes || 0), 0),
    };
  });

  const weekTotal = dailyTotals.reduce((acc, d) => acc + d.minutes, 0);
  const maxMinutes = Math.max(...dailyTotals.map(d => d.minutes), 60);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">This Week</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2 h-32 mb-4">
          {dailyTotals.map(({ day, minutes }) => (
            <div key={day.toISOString()} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className={`w-full rounded-t transition-all ${
                  isToday(day) ? "bg-primary" : "bg-primary/30"
                }`}
                style={{ 
                  height: `${Math.max((minutes / maxMinutes) * 100, 4)}%`,
                  minHeight: minutes > 0 ? "8px" : "4px",
                }}
                data-testid={`bar-${format(day, "EEE").toLowerCase()}`}
              />
              <span className={`text-xs ${isToday(day) ? "font-bold" : "text-muted-foreground"}`}>
                {format(day, "EEE")}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">Total this week</span>
          <span className="text-xl font-bold font-mono" data-testid="text-week-total">
            {formatDurationLong(weekTotal)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function TimeEntryItem({ 
  entry, 
  projects,
  onEdit,
  onDelete,
}: { 
  entry: TimeEntry;
  projects: Project[];
  onEdit: (entry: TimeEntry) => void;
  onDelete: (id: string) => void;
}) {
  const project = projects.find(p => p.id === entry.projectId);

  return (
    <div 
      className="group flex items-center justify-between p-4 rounded-lg bg-muted/30 hover-elevate transition-all"
      data-testid={`time-entry-${entry.id}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{entry.description || "Untitled entry"}</p>
          <div className="flex items-center gap-2 mt-1">
            {project && (
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ 
                  borderColor: project.color,
                  color: project.color,
                }}
              >
                {project.name}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {format(new Date(entry.startTime), "h:mm a")}
              {entry.endTime && ` - ${format(new Date(entry.endTime), "h:mm a")}`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono font-medium">
          {entry.durationMinutes 
            ? formatDurationLong(entry.durationMinutes)
            : "In progress"
          }
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(entry)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(entry.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function TimeTracker() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editDuration, setEditDuration] = useState("");

  const { data: timeEntries, isLoading: entriesLoading } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    refetchInterval: 10000,
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects", currentWorkspace?.id],
    enabled: !!currentWorkspace,
  });

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks", currentWorkspace?.id],
    enabled: !!currentWorkspace,
  });

  const activeEntry = timeEntries?.find(e => !e.endTime) || null;

  const completedEntries = timeEntries
    ?.filter(e => e.endTime)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const todayEntries = completedEntries?.filter(e => isToday(new Date(e.startTime)));
  const todayTotal = todayEntries?.reduce((acc, e) => acc + (e.durationMinutes || 0), 0) || 0;

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TimeEntry> }) => {
      return apiRequest("PATCH", `/api/time-entries/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Time entry updated" });
      setIsEditDialogOpen(false);
      setEditingEntry(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/time-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({ title: "Time entry deleted" });
    },
  });

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditDescription(entry.description || "");
    setEditDuration(entry.durationMinutes?.toString() || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingEntry) {
      updateMutation.mutate({
        id: editingEntry.id,
        data: {
          description: editDescription || null,
          durationMinutes: editDuration ? parseInt(editDuration) : null,
        },
      });
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Select a workspace to track time</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Time Tracker</h1>
        <p className="text-muted-foreground mt-1">
          Track your time and boost productivity
        </p>
      </div>

      <Timer
        workspaceId={currentWorkspace.id}
        projects={projects || []}
        tasks={tasks || []}
        activeEntry={activeEntry}
        onStop={() => {}}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <CardTitle className="text-lg font-semibold">Today's Entries</CardTitle>
              <Badge variant="secondary" className="font-mono">
                {formatDurationLong(todayTotal)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {entriesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : todayEntries && todayEntries.length > 0 ? (
                todayEntries.map((entry) => (
                  <TimeEntryItem
                    key={entry.id}
                    entry={entry}
                    projects={projects || []}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No time entries today</p>
                  <p className="text-sm mt-1">Start tracking to see your progress</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <WeeklyStats timeEntries={timeEntries || []} />
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
            <DialogDescription>Update the time entry details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="What were you working on?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                placeholder="30"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
