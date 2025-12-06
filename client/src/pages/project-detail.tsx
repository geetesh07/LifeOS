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
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { Project, Task, TimeEntry, Payment, Client, Milestone, ProjectNote, TaskStatus } from "@shared/schema";

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

export default function ProjectDetailPage() {
    const [, params] = useRoute("/projects/:id");
    const [, setLocation] = useLocation();
    const { currentWorkspace } = useWorkspace();
    const { toast } = useToast();
    const projectId = params?.id;

    const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
    const [noteContent, setNoteContent] = useState("");

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

    if (isLoading || !project) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Calculate stats
    const projectTasks = tasks?.filter(t => t.projectId === projectId) || [];
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
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
                    <TabsTrigger value="tasks" className="flex items-center gap-2">
                        <ListTodo className="h-4 w-4" />
                        <span className="hidden sm:inline">Tasks</span>
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
                            {projectTasks.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No tasks for this project yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {projectTasks.map(task => {
                                        const status = taskStatuses?.find(s => s.id === task.statusId);
                                        return (
                                            <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
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
                                                    {status && (
                                                        <Badge style={{ backgroundColor: status.color, color: "white" }}>
                                                            {status.name}
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline">{task.priority}</Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
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

    // Reset form when dialog opens or milestone changes
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
