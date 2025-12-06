import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    ArrowLeft,
    Users,
    Folder,
    IndianRupee,
    Clock,
    CheckCircle2,
    Mail,
    Phone,
    Building2,
    Calendar,
    TrendingUp,
    AlertCircle,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";
import type { Client, Project, Task, TimeEntry, Payment, TaskStatus } from "@shared/schema";

const statusColors = {
    active: "bg-green-500",
    completed: "bg-blue-500",
    archived: "bg-gray-500",
};

export default function ClientDetailPage() {
    const [, params] = useRoute("/clients/:id");
    const [, setLocation] = useLocation();
    const { currentWorkspace } = useWorkspace();
    const clientId = params?.id;

    // Queries
    const { data: client, isLoading } = useQuery<Client>({
        queryKey: [`/api/clients/${clientId}`],
        enabled: !!clientId,
    });

    const { data: projects } = useQuery<Project[]>({
        queryKey: [`/api/projects?workspaceId=${currentWorkspace?.id}`],
        enabled: !!currentWorkspace,
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

    if (isLoading || !client) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Calculate stats
    const clientProjects = projects?.filter(p => p.clientId === clientId) || [];
    const clientPayments = payments?.filter(p => p.clientId === clientId) || [];

    // Get all tasks for client's projects
    const clientProjectIds = clientProjects.map(p => p.id);
    const clientTasks = tasks?.filter(t => t.projectId && clientProjectIds.includes(t.projectId)) || [];
    const doneStatuses = taskStatuses?.filter(s => s.isDoneState).map(s => s.id) || [];
    const completedTasks = clientTasks.filter(t => t.statusId && doneStatuses.includes(t.statusId));

    // Time tracking for client projects
    const clientTimeEntries = timeEntries?.filter(e => e.projectId && clientProjectIds.includes(e.projectId)) || [];
    const totalMinutes = clientTimeEntries.reduce((acc, e) => acc + (e.durationMinutes || 0), 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

    // Financial calculations
    const totalBudget = clientProjects.reduce((acc, p) => acc + (p.budget || 0), 0);
    const totalReceived = clientPayments.reduce((acc, p) => acc + p.amount, 0);
    const pendingAmount = totalBudget - totalReceived;

    // Active vs completed projects
    const activeProjects = clientProjects.filter(p => p.status === "active");
    const completedProjects = clientProjects.filter(p => p.status === "completed");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setLocation("/clients")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white"
                            style={{ backgroundColor: client.color }}
                        >
                            {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{client.name}</h1>
                            {client.company && (
                                <p className="text-muted-foreground flex items-center gap-1">
                                    <Building2 className="h-4 w-4" />
                                    {client.company}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {client.email && (
                        <Button variant="outline" size="sm" asChild>
                            <a href={`mailto:${client.email}`}>
                                <Mail className="h-4 w-4 mr-1" />
                                Email
                            </a>
                        </Button>
                    )}
                    {client.phone && (
                        <Button variant="outline" size="sm" asChild>
                            <a href={`tel:${client.phone}`}>
                                <Phone className="h-4 w-4 mr-1" />
                                Call
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            {/* Contact Info */}
            {(client.email || client.phone) && (
                <Card className="glass">
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-6">
                            {client.email && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{client.email}</span>
                                </div>
                            )}
                            {client.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{client.phone}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                        <Folder className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{clientProjects.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeProjects.length} active, {completedProjects.length} completed
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalBudget.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            across all projects
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payments Received</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹{totalReceived.toLocaleString()}</div>
                        <Progress
                            value={totalBudget ? (totalReceived / totalBudget) * 100 : 0}
                            className="h-2 mt-2"
                        />
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${pendingAmount > 0 ? "text-orange-600" : "text-green-600"}`}>
                            ₹{Math.max(0, pendingAmount).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {pendingAmount > 0 ? "pending collection" : "fully paid!"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedTasks.length}/{clientTasks.length}</div>
                        <Progress
                            value={clientTasks.length ? (completedTasks.length / clientTasks.length) * 100 : 0}
                            className="h-2 mt-2"
                        />
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Time Tracked</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalHours}h</div>
                        <p className="text-xs text-muted-foreground">
                            {clientTimeEntries.length} time entries
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payments</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{clientPayments.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {clientPayments.length > 0
                                ? `Last: ${formatDistanceToNow(new Date(clientPayments[0].paymentDate), { addSuffix: true })}`
                                : "No payments yet"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Projects List */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Folder className="h-5 w-5" />
                        Client Projects ({clientProjects.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {clientProjects.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No projects for this client yet</p>
                    ) : (
                        <div className="space-y-3">
                            {clientProjects.map(project => {
                                const projectTasks = tasks?.filter(t => t.projectId === project.id) || [];
                                const projectCompletedTasks = projectTasks.filter(t => t.statusId && doneStatuses.includes(t.statusId));
                                const projectPayments = payments?.filter(p => p.projectId === project.id) || [];
                                const projectReceived = projectPayments.reduce((acc, p) => acc + p.amount, 0);
                                const progress = projectTasks.length ? (projectCompletedTasks.length / projectTasks.length) * 100 : 0;

                                return (
                                    <div
                                        key={project.id}
                                        className="flex items-center justify-between p-4 rounded-lg border bg-card/50 cursor-pointer hover:bg-accent/50 transition-colors"
                                        onClick={() => setLocation(`/projects/${project.id}`)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: project.color + "20" }}
                                            >
                                                <Folder className="h-5 w-5" style={{ color: project.color }} />
                                            </div>
                                            <div>
                                                <p className="font-medium">{project.name}</p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span>{projectCompletedTasks.length}/{projectTasks.length} tasks</span>
                                                    {project.dueDate && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(project.dueDate), "MMM d, yyyy")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-medium">₹{projectReceived.toLocaleString()}</p>
                                                <p className="text-xs text-muted-foreground">of ₹{(project.budget || 0).toLocaleString()}</p>
                                            </div>
                                            <div className="w-24">
                                                <Progress value={progress} className="h-2" />
                                            </div>
                                            <Badge className={`${statusColors[project.status as keyof typeof statusColors]} text-white`}>
                                                {project.status}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <IndianRupee className="h-5 w-5" />
                        Payment History ({clientPayments.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {clientPayments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No payments received yet</p>
                    ) : (
                        <div className="space-y-2">
                            {clientPayments.map(payment => {
                                const project = projects?.find(p => p.id === payment.projectId);
                                return (
                                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                                        <div>
                                            <p className="font-medium text-green-600">₹{payment.amount.toLocaleString()}</p>
                                            <p className="text-sm text-muted-foreground">{payment.description}</p>
                                            {project && (
                                                <p className="text-xs text-muted-foreground">Project: {project.name}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm">{format(new Date(payment.paymentDate), "MMM d, yyyy")}</p>
                                            <Badge variant="outline">{payment.paymentMethod}</Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Notes */}
            {client.notes && (
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap">{client.notes}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
