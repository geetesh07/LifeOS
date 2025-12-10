import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
    ArrowLeft,
    Calendar,
    Clock,
    IndianRupee,
    CheckCircle2,
    Target,
    ListTodo,
    MessageSquare,
    Activity,
    Plus,
    Trash2,
    Edit,
    Flag,
    CheckSquare,
    ChevronDown,
    ChevronRight,
    ListTree,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { Project, Task, TimeEntry, Payment, Client, Milestone, ProjectNote, TaskStatus, ProjectTodo } from "@shared/schema";

const priorityColors = {
    low: "bg-slate-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
};

const statusColors = {
    active: "bg-green-500",
    completed: "bg-blue-500",
    archived: "bg-gray-500",
};

// Component for displaying a task with expandable subtasks
function ProjectTaskItem({
    task,
    status,
    subtasks,
    completedSubtasksCount,
    hasSubtasks,
    taskStatuses,
    doneStatuses,
}: {
    task: Task;
    status?: TaskStatus;
    subtasks: Task[];
    completedSubtasksCount: number;
    hasSubtasks: boolean;
    taskStatuses: TaskStatus[];
    doneStatuses: string[];
}) {
    const [expanded, setExpanded] = React.useState(false);

    return (
        <div className="rounded-lg border bg-card/50">
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                    <Checkbox checked={!!task.completedAt} disabled />
                    <div>
                        <p className={task.completedAt ? "line-through text-muted-foreground" : "font-medium"}>
                            {task.title}
                        </p>
                        {task.dueDate && (
                            <p className="text-xs text-muted-foreground">
                                Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasSubtasks && (
                        <Badge variant="outline" className="text-xs">
                            <ListTree className="h-3 w-3 mr-1" />
                            {completedSubtasksCount}/{subtasks.length}
                        </Badge>
                    )}
                    {status && (
                        <Badge style={{ backgroundColor: status.color, color: "white" }}>
                            {status.name}
                        </Badge>
                    )}
                    <Badge variant="outline">{task.priority}</Badge>
                </div>
            </div>

            {/* Expandable subtasks section */}
            {hasSubtasks && (
                <div className="px-3 pb-3 pt-0 border-t">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 w-full"
                    >
                        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span>{expanded ? "Hide" : "Show"} {subtasks.length} subtask{subtasks.length > 1 ? "s" : ""}</span>
                    </button>
                    {expanded && (
                        <div className="space-y-2 pl-6">
                            {subtasks.map(subtask => {
                                const subtaskStatus = taskStatuses.find(s => s.id === subtask.statusId);
                                const isDone = !!(subtask.statusId && doneStatuses.includes(subtask.statusId));
                                return (
                                    <div
                                        key={subtask.id}
                                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Checkbox checked={isDone} disabled />
                                            <span className={isDone ? "line-through text-muted-foreground text-sm" : "text-sm"}>
                                                {subtask.title}
                                            </span>
                                        </div>
                                        {subtaskStatus && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                                style={{ borderColor: subtaskStatus.color, color: subtaskStatus.color }}
                                            >
                                                {subtaskStatus.name}
                                            </Badge>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Nested checklist item component with sub-todos support
function NestedChecklistItem({
    todo,
    allTodos,
    projectId,
    workspaceId,
    onToggle,
    onDelete,
    onAddSubTodo,
    depth = 0,
}: {
    todo: ProjectTodo;
    allTodos: ProjectTodo[];
    projectId: string;
    workspaceId: string;
    onToggle: (id: string, completed: boolean) => void;
    onDelete: (id: string) => void;
    onAddSubTodo: (parentId: string, title: string) => void;
    depth?: number;
}) {
    const [expanded, setExpanded] = React.useState(true);
    const [showAddForm, setShowAddForm] = React.useState(false);
    const [subTodoTitle, setSubTodoTitle] = React.useState("");

    const subTodos = allTodos.filter(t => t.parentTodoId === todo.id);
    const hasSubTodos = subTodos.length > 0;
    const completedSubTodos = subTodos.filter(t => t.completed);

    const handleAddSubTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (subTodoTitle.trim()) {
            onAddSubTodo(todo.id, subTodoTitle);
            setSubTodoTitle("");
            setShowAddForm(false);
        }
    };

    // Limit nesting depth to 2 levels
    const canAddSubTodo = depth < 2;

    return (
        <div className={`rounded-lg border bg-card/50 ${depth > 0 ? "ml-6" : ""}`}>
            <div className="flex items-center justify-between p-3 group">
                <div className="flex items-center gap-3">
                    {hasSubTodos ? (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                    ) : (
                        <div className="w-4" />
                    )}
                    <Checkbox
                        checked={todo.completed}
                        onCheckedChange={(checked) => onToggle(todo.id, !!checked)}
                    />
                    <div>
                        <span className={todo.completed ? "line-through text-muted-foreground" : ""}>
                            {todo.title}
                        </span>
                        {hasSubTodos && (
                            <span className="text-xs text-muted-foreground ml-2">
                                ({completedSubTodos.length}/{subTodos.length})
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canAddSubTodo && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setShowAddForm(!showAddForm)}
                            title="Add sub-item"
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => onDelete(todo.id)}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Add sub-todo form */}
            {showAddForm && (
                <form onSubmit={handleAddSubTodo} className="px-3 pb-3 flex gap-2 ml-7">
                    <Input
                        placeholder="Add sub-item..."
                        value={subTodoTitle}
                        onChange={(e) => setSubTodoTitle(e.target.value)}
                        className="flex-1 h-8 text-sm"
                        autoFocus
                    />
                    <Button type="submit" size="sm" disabled={!subTodoTitle.trim()}>
                        Add
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                        Cancel
                    </Button>
                </form>
            )}

            {/* Sub-todos */}
            {expanded && hasSubTodos && (
                <div className="pb-2 space-y-2">
                    {subTodos.map(subTodo => (
                        <NestedChecklistItem
                            key={subTodo.id}
                            todo={subTodo}
                            allTodos={allTodos}
                            projectId={projectId}
                            workspaceId={workspaceId}
                            onToggle={onToggle}
                            onDelete={onDelete}
                            onAddSubTodo={onAddSubTodo}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ProjectDetailPage() {
    const [, params] = useRoute("/projects/:id");
    const [, setLocation] = useLocation();
    const { currentWorkspace } = useWorkspace();
    const { toast } = useToast();
    const projectId = params?.id;

    const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
    const [noteContent, setNoteContent] = useState("");
    const [editProjectOpen, setEditProjectOpen] = useState(false);
    const [newTodoTitle, setNewTodoTitle] = useState("");

    // Queries
    const { data: project, isLoading } = useQuery<Project>({
        queryKey: [`/api/projects/${projectId}`],
        enabled: !!projectId,
    });

    const { data: client } = useQuery<Client>({
        queryKey: [`/api/clients/${project?.clientId}`],
        enabled: !!project?.clientId,
    });

    const { data: tasks } = useQuery<Task[]>({
        queryKey: [`/api/tasks?workspaceId=${currentWorkspace?.id}`],
        enabled: !!currentWorkspace,
    });

    const { data: taskStatuses } = useQuery<TaskStatus[]>({
        queryKey: [`/api/task-statuses?workspaceId=${currentWorkspace?.id}`],
        enabled: !!currentWorkspace,
    });

    const { data: timeEntries } = useQuery<TimeEntry[]>({
        queryKey: ["/api/time-entries", currentWorkspace?.id],
        enabled: !!currentWorkspace,
    });

    const { data: payments } = useQuery<Payment[]>({
        queryKey: [`/api/payments?workspaceId=${currentWorkspace?.id}`],
        enabled: !!currentWorkspace,
    });

    const { data: milestones } = useQuery<Milestone[]>({
        queryKey: [`/api/milestones?projectId=${projectId}`],
        enabled: !!projectId,
    });

    const { data: projectNotes } = useQuery<ProjectNote[]>({
        queryKey: [`/api/project-notes?projectId=${projectId}`],
        enabled: !!projectId,
    });

    const { data: clients } = useQuery<Client[]>({
        queryKey: [`/api/clients?workspaceId=${currentWorkspace?.id}`],
        enabled: !!currentWorkspace,
    });

    const { data: projectTodos } = useQuery<ProjectTodo[]>({
        queryKey: [`/api/project-todos?projectId=${projectId}`],
        enabled: !!projectId,
    });

    // Mutations
    const createMilestoneMutation = useMutation({
        mutationFn: async (data: any) => apiRequest("POST", "/api/milestones", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/milestones?projectId=${projectId}`] });
            toast({ title: "Milestone created!" });
            setMilestoneDialogOpen(false);
        },
    });

    const updateMilestoneMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) =>
            apiRequest("PATCH", `/api/milestones/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/milestones?projectId=${projectId}`] });
            toast({ title: "Milestone updated!" });
            setMilestoneDialogOpen(false);
            setEditingMilestone(null);
        },
    });

    const deleteMilestoneMutation = useMutation({
        mutationFn: async (id: string) => apiRequest("DELETE", `/api/milestones/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/milestones?projectId=${projectId}`] });
            toast({ title: "Milestone deleted" });
        },
    });

    const createNoteMutation = useMutation({
        mutationFn: async (data: any) => apiRequest("POST", "/api/project-notes", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/project-notes?projectId=${projectId}`] });
            toast({ title: "Note added!" });
            setNoteContent("");
        },
    });

    const deleteNoteMutation = useMutation({
        mutationFn: async (id: string) => apiRequest("DELETE", `/api/project-notes/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/project-notes?projectId=${projectId}`] });
        },
    });

    const updateProjectMutation = useMutation({
        mutationFn: async (data: Partial<Project>) =>
            apiRequest("PATCH", `/api/projects/${projectId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
            toast({ title: "Project updated!" });
            setEditProjectOpen(false);
        },
    });

    // Project Todo mutations
    const createTodoMutation = useMutation({
        mutationFn: async (data: any) => apiRequest("POST", "/api/project-todos", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/project-todos?projectId=${projectId}`] });
            setNewTodoTitle("");
        },
    });

    const toggleTodoMutation = useMutation({
        mutationFn: async ({ id, completed }: { id: string; completed: boolean }) =>
            apiRequest("PATCH", `/api/project-todos/${id}`, { completed }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/project-todos?projectId=${projectId}`] });
        },
    });

    const deleteTodoMutation = useMutation({
        mutationFn: async (id: string) => apiRequest("DELETE", `/api/project-todos/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/project-todos?projectId=${projectId}`] });
        },
    });

    if (isLoading || !project) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Calculate stats
    const projectTasks = tasks?.filter(t => t.projectId === projectId) || [];
    const parentTasks = projectTasks.filter(t => !t.parentTaskId);
    const doneStatuses = taskStatuses?.filter(s => s.isDoneState).map(s => s.id) || [];
    const completedTasks = projectTasks.filter(t => t.statusId && doneStatuses.includes(t.statusId));
    const projectTimeEntries = timeEntries?.filter(t => t.projectId === projectId) || [];
    const projectPayments = payments?.filter(p => p.projectId === projectId) || [];

    const totalMinutes = projectTimeEntries.reduce((acc, entry) => acc + (entry.durationMinutes || 0), 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    const totalPayments = projectPayments.reduce((acc, p) => acc + p.amount, 0);
    const pendingAmount = (project.budget || 0) - totalPayments;

    // Task status breakdown for chart
    const statusBreakdown = taskStatuses?.map(status => ({
        name: status.name,
        value: projectTasks.filter(t => t.statusId === status.id).length,
        color: status.color,
    })).filter(s => s.value > 0) || [];

    // Duration calculation
    const startDate = project.startDate ? new Date(project.startDate) : null;
    const endDate = project.dueDate ? new Date(project.dueDate) : null;
    const duration = startDate && endDate ? differenceInDays(endDate, startDate) : null;
    const daysRemaining = endDate ? differenceInDays(endDate, new Date()) : null;

    // Activity log - combine all recent activity
    const activityLog = [
        ...projectTasks.map(t => ({
            type: "task",
            title: t.title,
            date: t.completedAt || new Date(),
            status: t.completedAt ? "completed" : "created",
        })),
        ...projectTimeEntries.slice(0, 10).map(e => ({
            type: "time",
            title: e.description || "Time tracked",
            date: e.startTime,
            duration: e.durationMinutes,
        })),
        ...projectPayments.map(p => ({
            type: "payment",
            title: `Payment: ₹${p.amount}`,
            date: p.paymentDate,
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setLocation("/projects")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: project.color + "20" }}
                        >
                            <Target className="h-5 w-5" style={{ color: project.color }} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{project.name}</h1>
                            {client && <p className="text-muted-foreground">{client.name}</p>}
                        </div>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditProjectOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Project
                </Button>
                <Badge className={`${statusColors[project.status as keyof typeof statusColors]} text-white`}>
                    {project.status}
                </Badge>
                <Badge className={`${priorityColors[project.priority as keyof typeof priorityColors]} text-white`}>
                    <Flag className="h-3 w-3 mr-1" />
                    {project.priority}
                </Badge>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedTasks.length}/{projectTasks.length}</div>
                        <Progress value={projectTasks.length ? (completedTasks.length / projectTasks.length) * 100 : 0} className="h-2 mt-2" />
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Starts</CardTitle>
                        <Calendar className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {startDate ? format(startDate, "MMM d") : "—"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {startDate ? format(startDate, "yyyy") : "Not set"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ends</CardTitle>
                        <Calendar className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {endDate ? format(endDate, "MMM d") : "—"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {daysRemaining !== null ? (daysRemaining > 0 ? `${daysRemaining} days left` : "Overdue") : "Not set"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Duration</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{duration !== null ? `${duration} days` : "—"}</div>
                        <p className="text-xs text-muted-foreground">{totalHours}h tracked</p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{project.budget?.toLocaleString() || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            ₹{totalPayments.toLocaleString()} received
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Task Statistics Chart */}
            {statusBreakdown.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>Task Statistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={statusBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {statusBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>Payment Progress</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Received</span>
                                    <span className="text-green-600">₹{totalPayments.toLocaleString()}</span>
                                </div>
                                <Progress
                                    value={project.budget ? (totalPayments / project.budget) * 100 : 0}
                                    className="h-3"
                                />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Pending</span>
                                <span className="text-orange-600">₹{Math.max(0, pendingAmount).toLocaleString()}</span>
                            </div>
                            {projectPayments.length > 0 && (
                                <div className="pt-4 border-t">
                                    <p className="text-xs text-muted-foreground">
                                        Last payment: {formatDistanceToNow(new Date(projectPayments[0].paymentDate), { addSuffix: true })}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5">
                    <TabsTrigger value="tasks" className="flex items-center gap-2">
                        <ListTodo className="h-4 w-4" />
                        <span className="hidden sm:inline">Tasks</span>
                    </TabsTrigger>
                    <TabsTrigger value="checklist" className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">Checklist</span>
                    </TabsTrigger>
                    <TabsTrigger value="milestones" className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span className="hidden sm:inline">Milestones</span>
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span className="hidden sm:inline">Activity</span>
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">Notes</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tasks Tab */}
                <TabsContent value="tasks" className="mt-4">
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>Project Tasks ({projectTasks.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {parentTasks.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No tasks for this project yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {parentTasks.map(task => {
                                        const status = taskStatuses?.find(s => s.id === task.statusId);
                                        const subtasks = projectTasks.filter(t => t.parentTaskId === task.id);
                                        const completedSubtasks = subtasks.filter(s => s.statusId && doneStatuses.includes(s.statusId));
                                        const hasSubtasks = subtasks.length > 0;

                                        return (
                                            <ProjectTaskItem
                                                key={task.id}
                                                task={task}
                                                status={status}
                                                subtasks={subtasks}
                                                completedSubtasksCount={completedSubtasks.length}
                                                hasSubtasks={hasSubtasks}
                                                taskStatuses={taskStatuses || []}
                                                doneStatuses={doneStatuses}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Checklist Tab */}
                <TabsContent value="checklist" className="mt-4">
                    <Card className="glass">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Project Checklist</CardTitle>
                                {projectTodos && projectTodos.length > 0 && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {projectTodos.filter(t => t.completed).length} of {projectTodos.length} completed
                                    </p>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add new todo form */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (newTodoTitle.trim() && projectId && currentWorkspace) {
                                        createTodoMutation.mutate({
                                            projectId,
                                            workspaceId: currentWorkspace.id,
                                            title: newTodoTitle,
                                        });
                                    }
                                }}
                                className="flex gap-2"
                            >
                                <Input
                                    placeholder="Add a checklist item..."
                                    value={newTodoTitle}
                                    onChange={(e) => setNewTodoTitle(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" size="icon" disabled={!newTodoTitle.trim()}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </form>

                            {/* Todo list - nested structure */}
                            {!projectTodos || projectTodos.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">
                                    No checklist items yet. Add your first!
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {/* Filter only parent todos (no parentTodoId) */}
                                    {projectTodos.filter(t => !t.parentTodoId).map(todo => (
                                        <NestedChecklistItem
                                            key={todo.id}
                                            todo={todo}
                                            allTodos={projectTodos}
                                            projectId={projectId!}
                                            workspaceId={currentWorkspace!.id}
                                            onToggle={(id, completed) => toggleTodoMutation.mutate({ id, completed })}
                                            onDelete={(id) => deleteTodoMutation.mutate(id)}
                                            onAddSubTodo={(parentId, title) => createTodoMutation.mutate({
                                                projectId: projectId!,
                                                workspaceId: currentWorkspace!.id,
                                                title,
                                                parentTodoId: parentId,
                                            })}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Progress bar */}
                            {projectTodos && projectTodos.length > 0 && (
                                <div className="pt-4 border-t">
                                    <Progress
                                        value={(projectTodos.filter(t => t.completed).length / projectTodos.length) * 100}
                                        className="h-2"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Milestones Tab */}
                <TabsContent value="milestones" className="mt-4">
                    <Card className="glass">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Milestones</CardTitle>
                            <Button size="sm" onClick={() => { setEditingMilestone(null); setMilestoneDialogOpen(true); }}>
                                <Plus className="h-4 w-4 mr-1" /> Add Milestone
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {!milestones || milestones.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No milestones yet. Add your first!</p>
                            ) : (
                                <div className="space-y-3">
                                    {milestones.map(milestone => (
                                        <div key={milestone.id} className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={!!milestone.completedAt}
                                                    onCheckedChange={(checked) => {
                                                        updateMilestoneMutation.mutate({
                                                            id: milestone.id,
                                                            data: { completedAt: checked ? new Date().toISOString() : null }
                                                        });
                                                    }}
                                                />
                                                <div>
                                                    <p className={milestone.completedAt ? "line-through text-muted-foreground" : "font-medium"}>
                                                        {milestone.title}
                                                    </p>
                                                    {milestone.description && (
                                                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                                                    )}
                                                    {milestone.dueDate && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Due: {format(new Date(milestone.dueDate), "MMM d, yyyy")}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => { setEditingMilestone(milestone); setMilestoneDialogOpen(true); }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => deleteMilestoneMutation.mutate(milestone.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="mt-4">
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>Activity Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activityLog.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No activity yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {activityLog.map((item, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === "task" ? "bg-blue-100 text-blue-600" :
                                                item.type === "time" ? "bg-green-100 text-green-600" :
                                                    "bg-yellow-100 text-yellow-600"
                                                }`}>
                                                {item.type === "task" ? <CheckCircle2 className="h-4 w-4" /> :
                                                    item.type === "time" ? <Clock className="h-4 w-4" /> :
                                                        <IndianRupee className="h-4 w-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{item.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="mt-4">
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>Discussion Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Textarea
                                    placeholder="Add a note or discussion point..."
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={() => {
                                        if (noteContent.trim()) {
                                            createNoteMutation.mutate({
                                                projectId,
                                                workspaceId: currentWorkspace?.id,
                                                content: noteContent,
                                            });
                                        }
                                    }}
                                    disabled={!noteContent.trim()}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {!projectNotes || projectNotes.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">No notes yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {projectNotes.map(note => (
                                        <div key={note.id} className="p-4 rounded-lg border bg-card/50">
                                            <div className="flex justify-between items-start">
                                                <p className="whitespace-pre-wrap">{note.content}</p>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive shrink-0"
                                                    onClick={() => deleteNoteMutation.mutate(note.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Milestone Dialog */}
            <MilestoneDialog
                open={milestoneDialogOpen}
                onClose={() => { setMilestoneDialogOpen(false); setEditingMilestone(null); }}
                milestone={editingMilestone}
                projectId={projectId!}
                workspaceId={currentWorkspace?.id!}
                onSave={(data) => {
                    if (editingMilestone) {
                        updateMilestoneMutation.mutate({ id: editingMilestone.id, data });
                    } else {
                        createMilestoneMutation.mutate(data);
                    }
                }}
            />

            {/* Edit Project Dialog */}
            <EditProjectDialog
                open={editProjectOpen}
                onClose={() => setEditProjectOpen(false)}
                project={project}
                clients={clients || []}
                onSave={(data) => updateProjectMutation.mutate(data)}
            />
        </div>
    );
}

function MilestoneDialog({
    open,
    onClose,
    milestone,
    projectId,
    workspaceId,
    onSave,
}: {
    open: boolean;
    onClose: () => void;
    milestone: Milestone | null;
    projectId: string;
    workspaceId: string;
    onSave: (data: any) => void;
}) {
    const [title, setTitle] = useState(milestone?.title || "");
    const [description, setDescription] = useState(milestone?.description || "");
    const [dueDate, setDueDate] = useState(
        milestone?.dueDate ? format(new Date(milestone.dueDate), "yyyy-MM-dd") : ""
    );

    useEffect(() => {
        if (open) {
            setTitle(milestone?.title || "");
            setDescription(milestone?.description || "");
            setDueDate(milestone?.dueDate ? format(new Date(milestone.dueDate), "yyyy-MM-dd") : "");
        }
    }, [open, milestone]);

    const handleSubmit = () => {
        onSave({
            projectId,
            workspaceId,
            title,
            description: description || null,
            dueDate: dueDate || null,
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{milestone ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Milestone title..."
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description..."
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Due Date</label>
                        <Input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!title.trim()}>
                        {milestone ? "Update" : "Create"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EditProjectDialog({
    open,
    onClose,
    project,
    clients,
    onSave,
}: {
    open: boolean;
    onClose: () => void;
    project: Project;
    clients: Client[];
    onSave: (data: Partial<Project>) => void;
}) {
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description || "");
    const [budget, setBudget] = useState(project.budget?.toString() || "");
    const [hourlyRate, setHourlyRate] = useState(project.hourlyRate?.toString() || "");
    const [status, setStatus] = useState(project.status);
    const [priority, setPriority] = useState(project.priority);
    const [clientId, setClientId] = useState(project.clientId || "");
    const [dueDate, setDueDate] = useState(
        project.dueDate ? format(new Date(project.dueDate), "yyyy-MM-dd") : ""
    );

    useEffect(() => {
        if (open) {
            setName(project.name);
            setDescription(project.description || "");
            setBudget(project.budget?.toString() || "");
            setHourlyRate(project.hourlyRate?.toString() || "");
            setStatus(project.status);
            setPriority(project.priority);
            setClientId(project.clientId || "");
            setDueDate(project.dueDate ? format(new Date(project.dueDate), "yyyy-MM-dd") : "");
        }
    }, [open, project]);

    const handleSubmit = () => {
        onSave({
            name,
            description: description || null,
            budget: budget ? parseFloat(budget) : null,
            hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
            status,
            priority,
            clientId: clientId || null,
            dueDate: dueDate ? new Date(dueDate) : null,
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div>
                        <label className="text-sm font-medium">Project Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Project name..."
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Project description..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Budget (₹)</label>
                            <Input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Hourly Rate (₹)</label>
                            <Input
                                type="number"
                                value={hourlyRate}
                                onChange={(e) => setHourlyRate(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Status</label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Priority</label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Client</label>
                            <Select value={clientId || "_none"} onValueChange={(v) => setClientId(v === "_none" ? "" : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select client" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">No client</SelectItem>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Due Date</label>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!name.trim()}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
