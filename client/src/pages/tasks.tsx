import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanSkeleton, ListSkeleton } from "@/components/LoadingSkeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  Edit,
  CheckCircle2,
  Circle,
  Flag,
  GripVertical,
  Filter,
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronRight,
  ListTree,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, isToday, isTomorrow, isPast, differenceInHours } from "date-fns";
import type { Task, Project, InsertTask, TaskStatus } from "@shared/schema";
import { EnhancedKanban } from "@/components/EnhancedKanban";
import { StatusManager } from "@/components/StatusManager";

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-slate-400",
};

const priorityLabels: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};


interface TaskCardProps {
  task: Task;
  subtasks?: Task[];
  doneStatusIds?: string[];
  onEdit: (task: Task) => void;
  onStatusChange: (taskId: string, status: string) => void;
  onDelete: (taskId: string) => void;
}

function TaskCard({ task, subtasks = [], doneStatusIds = [], onEdit, onStatusChange, onDelete }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "done";
  const completedSubtasks = subtasks.filter(s => s.statusId && doneStatusIds.includes(s.statusId));
  const hasSubtasks = subtasks.length > 0;

  return (
    <Card
      className="group hover-elevate transition-all cursor-pointer"
      data-testid={`task-card-${task.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(task.id, task.status === "done" ? "todo" : "done");
            }}
            className="mt-0.5 flex-shrink-0"
            data-testid={`task-checkbox-${task.id}`}
          >
            {task.status === "done" ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            )}
          </button>

          <div className="flex-1 min-w-0" onClick={() => onEdit(task)}>
            <p className={`font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
                <span className="text-xs text-muted-foreground">{priorityLabels[task.priority]}</span>
              </div>
              {task.dueDate && (
                <Badge
                  variant="outline"
                  className={`text-xs ${isOverdue ? "border-red-500 text-red-500" : ""}`}
                >
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {formatDueDate(new Date(task.dueDate))}
                </Badge>
              )}
              {task.estimatedMinutes && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {task.estimatedMinutes}m
                </Badge>
              )}
              {hasSubtasks && (
                <Badge variant="outline" className="text-xs">
                  <ListTree className="h-3 w-3 mr-1" />
                  {completedSubtasks.length}/{subtasks.length} subtasks
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                data-testid={`task-menu-${task.id}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Expandable subtasks section */}
        {hasSubtasks && (
          <div className="mt-3 pt-3 border-t">
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span>{expanded ? "Hide" : "Show"} {subtasks.length} subtask{subtasks.length > 1 ? "s" : ""}</span>
            </button>
            {expanded && (
              <div className="mt-2 space-y-2 pl-6">
                {subtasks.map(subtask => {
                  const isDone = subtask.statusId && doneStatusIds.includes(subtask.statusId);
                  return (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => onEdit(subtask)}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={`text-sm ${isDone ? "line-through text-muted-foreground" : ""}`}>
                        {subtask.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskForm({
  task,
  workspaceId,
  projects,
  statuses,
  allTasks,
  onClose
}: {
  task?: Task;
  workspaceId: string;
  projects: Project[];
  statuses: TaskStatus[];
  allTasks?: Task[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const defaultStatus = statuses.find(s => s.isDefault);
  const [statusId, setStatusId] = useState(task?.statusId || defaultStatus?.id || "");
  const [projectId, setProjectId] = useState(task?.projectId || "");
  const [startDate, setStartDate] = useState(
    task?.startDate ? format(new Date(task.startDate), "yyyy-MM-dd'T'HH:mm") : ""
  );
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : ""
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    task?.estimatedMinutes?.toString() || ""
  );
  const [reminderMinutes, setReminderMinutes] = useState(
    task?.reminderMinutes?.toString() || ""
  );
  const [reminderPreset, setReminderPreset] = useState<string>(
    task?.reminderMinutes ? (
      [10, 30, 60, 1440].includes(task.reminderMinutes) ? task.reminderMinutes.toString() : "custom"
    ) : "none"
  );
  const [reminder2Minutes, setReminder2Minutes] = useState(
    task?.reminder2Minutes?.toString() || ""
  );
  const [reminder2Preset, setReminder2Preset] = useState<string>(
    task?.reminder2Minutes ? (
      [10, 30, 60, 1440].includes(task.reminder2Minutes) ? task.reminder2Minutes.toString() : "custom"
    ) : "none"
  );
  const [parentTaskId, setParentTaskId] = useState(task?.parentTaskId || "");

  // Filter tasks that can be parents (not subtasks and not this task)
  const parentableTasks = allTasks?.filter(t =>
    !t.parentTaskId && t.id !== task?.id
  ) || [];

  const createMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      return apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks?workspaceId=${workspaceId}`] });
      toast({ title: "Task created successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to create task", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      return apiRequest("PATCH", `/api/tasks/${task?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks?workspaceId=${workspaceId}`] });
      toast({ title: "Task updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      workspaceId,
      title,
      description: description || null,
      priority,
      statusId: statusId || null,
      projectId: projectId || null,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
      reminderMinutes: reminderPreset === "none" ? null : (reminderPreset === "custom" ? parseInt(reminderMinutes) : parseInt(reminderPreset)),
      reminderSent: false,
      reminder2Minutes: reminder2Preset === "none" ? null : (reminder2Preset === "custom" ? parseInt(reminder2Minutes) : parseInt(reminder2Preset)),
      reminder2Sent: false,
      parentTaskId: parentTaskId || null,
    };

    if (task) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data as InsertTask);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          required
          data-testid="input-task-title"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description..."
          rows={3}
          data-testid="input-task-description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger data-testid="select-task-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={statusId} onValueChange={setStatusId}>
            <SelectTrigger data-testid="select-task-status">
              <SelectValue placeholder={statuses.length === 0 ? "No statuses available" : "Select status"} />
            </SelectTrigger>
            <SelectContent>
              {statuses.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  No statuses available. Please add statuses in settings.
                </div>
              ) : (
                statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                      {status.name}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">📅 Start Date & Time</label>
          <Input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            data-testid="input-task-start-date"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">🏁 Deadline (End Date)</label>
          <Input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            data-testid="input-task-due-date"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Est. Minutes</label>
          <Input
            type="number"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            placeholder="30"
            min="1"
            data-testid="input-task-estimate"
          />
        </div>
      </div>

      {projects.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Project</label>
          <Select
            value={projectId || "_none"}
            onValueChange={(val) => setProjectId(val === "_none" ? "" : val)}
          >
            <SelectTrigger data-testid="select-task-project">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">No project</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Parent Task (make this a subtask) */}
      {parentableTasks.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <ListTree className="h-4 w-4" />
            Parent Task (make this a subtask)
          </label>
          <Select
            value={parentTaskId || "_none"}
            onValueChange={(val) => setParentTaskId(val === "_none" ? "" : val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="No parent (top-level task)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">No parent (top-level task)</SelectItem>
              {parentableTasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Reminder 1 - Before START time */}
      <div className="space-y-2">
        <label className="text-sm font-medium">🔔 Reminder before START time</label>
        <Select
          value={reminderPreset}
          onValueChange={(val) => {
            setReminderPreset(val);
            if (val !== "custom" && val !== "none") {
              setReminderMinutes(val);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="No reminder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No reminder</SelectItem>
            <SelectItem value="1440">1 day before</SelectItem>
            <SelectItem value="720">12 hours before</SelectItem>
            <SelectItem value="360">6 hours before</SelectItem>
            <SelectItem value="120">2 hours before</SelectItem>
            <SelectItem value="60">1 hour before</SelectItem>
            <SelectItem value="custom">Custom...</SelectItem>
          </SelectContent>
        </Select>
        {reminderPreset === "custom" && (
          <Input
            type="number"
            value={reminderMinutes}
            onChange={(e) => setReminderMinutes(e.target.value)}
            placeholder="Minutes before due date"
            min="1"
            className="mt-2"
          />
        )}
      </div>

      {/* Reminder 2 - Before DEADLINE */}
      <div className="space-y-2">
        <label className="text-sm font-medium">⏰ Reminder before DEADLINE</label>
        <Select
          value={reminder2Preset}
          onValueChange={(val) => {
            setReminder2Preset(val);
            if (val !== "custom" && val !== "none") {
              setReminder2Minutes(val);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="No reminder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No reminder</SelectItem>
            <SelectItem value="60">1 hour before</SelectItem>
            <SelectItem value="30">30 minutes before</SelectItem>
            <SelectItem value="15">15 minutes before</SelectItem>
            <SelectItem value="10">10 minutes before</SelectItem>
            <SelectItem value="5">5 minutes before</SelectItem>
            <SelectItem value="custom">Custom...</SelectItem>
          </SelectContent>
        </Select>
        {reminder2Preset === "custom" && (
          <Input
            type="number"
            value={reminder2Minutes}
            onChange={(e) => setReminder2Minutes(e.target.value)}
            placeholder="Minutes before due date"
            min="1"
            className="mt-2"
          />
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} data-testid="button-save-task">
          {isPending ? "Saving..." : task ? "Update Task" : "Create Task"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function Tasks() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("none");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: [`/api/tasks?workspaceId=${currentWorkspace?.id}`],
    enabled: !!currentWorkspace,
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: [`/api/projects?workspaceId=${currentWorkspace?.id}`],
    enabled: !!currentWorkspace,
  });

  const { data: statuses } = useQuery<TaskStatus[]>({
    queryKey: [`/api/task-statuses?workspaceId=${currentWorkspace?.id}`],
    enabled: !!currentWorkspace,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, statusId }: { taskId: string; statusId: string }) => {
      // Find if the new status is a "done" state
      const status = statuses?.find(s => s.id === statusId);
      return apiRequest("PATCH", `/api/tasks/${taskId}`, {
        statusId,
        completedAt: status?.isDoneState ? new Date() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks?workspaceId=${currentWorkspace?.id}`] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks?workspaceId=${currentWorkspace?.id}`] });
      toast({ title: "Task deleted" });
    },
  });

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleTaskMove = (taskId: string, newStatusId: string) => {
    updateStatusMutation.mutate({ taskId, statusId: newStatusId });
  };

  const handleDelete = (taskId: string) => {
    deleteMutation.mutate(taskId);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTask(undefined);
  };

  // Get done statuses for filtering
  const doneStatusIds = statuses?.filter(s => s.isDoneState).map(s => s.id) || [];

  const filteredTasks = tasks?.filter(task => {
    // Only show top-level tasks (not subtasks)
    if (task.parentTaskId) return false;

    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;

    // Hide completed tasks older than 24 hours from main Tasks page
    const isDone = task.statusId && doneStatusIds.includes(task.statusId);
    const completedRecently = !task.completedAt || differenceInHours(new Date(), new Date(task.completedAt)) < 24;
    const showTask = !isDone || completedRecently;

    return matchesSearch && matchesPriority && matchesProject && showTask;
  });

  // Sort tasks based on selection
  const sortedTasks = useMemo(() => {
    if (!filteredTasks || sortBy === 'none') return filteredTasks;

    return [...filteredTasks].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

        case 'priority': {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 999) -
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 999);
        }

        case 'created':
          // Most recent first
          return b.order - a.order;

        default:
          return 0;
      }
    });
  }, [filteredTasks, sortBy]);

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Select a workspace to view tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Manage your tasks and stay productive
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                Manage Statuses
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Manage Task Statuses</DialogTitle>
                <DialogDescription>
                  Customize your workflow by adding, editing, or reordering statuses
                </DialogDescription>
              </DialogHeader>
              <StatusManager workspaceId={currentWorkspace.id} />
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTask(undefined)} data-testid="button-new-task">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
                <DialogDescription>
                  {editingTask ? "Update the task details below" : "Add a new task to your workspace"}
                </DialogDescription>
              </DialogHeader>
              <TaskForm
                task={editingTask}
                workspaceId={currentWorkspace.id}
                projects={projects || []}
                statuses={statuses || []}
                allTasks={tasks}
                onClose={handleCloseDialog}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="pl-10"
            data-testid="input-search-tasks"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {projects && projects.length > 0 && (
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-project-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Sorting</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="created">Created Date</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-priority-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={view === "kanban" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setView("kanban")}
              data-testid="button-view-kanban"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setView("list")}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading || !statuses ? (
        view === "kanban" ? (
          <KanbanSkeleton count={3} />
        ) : (
          <ListSkeleton count={5} />
        )
      ) : view === "kanban" ? (
        <EnhancedKanban
          tasks={filteredTasks || []}
          statuses={statuses}
          onTaskMove={handleTaskMove}
          onTaskEdit={handleEdit}
          onTaskDelete={handleDelete}
        />
      ) : (
        <div className="space-y-3">
          {filteredTasks?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No tasks found</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks?.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                subtasks={tasks?.filter(t => t.parentTaskId === task.id) || []}
                doneStatusIds={doneStatusIds}
                onEdit={handleEdit}
                onStatusChange={(_, status) => {
                  const targetStatus = statuses.find(s => s.name.toLowerCase() === status.toLowerCase());
                  if (targetStatus) {
                    handleTaskMove(task.id, targetStatus.id);
                  }
                }}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
