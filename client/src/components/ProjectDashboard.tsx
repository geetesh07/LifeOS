import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Task, Project, TimeEntry } from "@shared/schema";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Clock, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/dateUtils";

interface ProjectDashboardProps {
    project: Project;
    tasks: Task[];
    timeEntries: TimeEntry[];
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

export function ProjectDashboard({ project, tasks, timeEntries }: ProjectDashboardProps) {
    // Calculate stats
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    const completedTasks = projectTasks.filter(t => t.completedAt);
    const projectTimeEntries = timeEntries.filter(t => t.projectId === project.id);

    const totalMinutes = projectTimeEntries.reduce((acc, entry) => acc + (entry.durationMinutes || 0), 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    const estimatedCost = project.hourlyRate ? totalHours * project.hourlyRate : 0;

    // Task breakdown by priority
    const tasksByPriority = [
        { name: "Low", value: projectTasks.filter(t => t.priority === "low").length, color: "#94a3b8" },
        { name: "Medium", value: projectTasks.filter(t => t.priority === "medium").length, color: "#f59e0b" },
        { name: "High", value: projectTasks.filter(t => t.priority === "high").length, color: "#fb923c" },
        { name: "Urgent", value: projectTasks.filter(t => t.priority === "urgent").length, color: "#ef4444" },
    ].filter(item => item.value > 0);

    // Task completion breakdown
    const completionData = [
        { name: "Completed", value: completedTasks.length, color: "#22c55e" },
        { name: "In Progress", value: projectTasks.length - completedTasks.length, color: "#3b82f6" },
    ];

    const completionRate = projectTasks.length > 0
        ? Math.round((completedTasks.length / projectTasks.length) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{projectTasks.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {completedTasks.length} completed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completionRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            {projectTasks.length - completedTasks.length} remaining
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Time Tracked</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalHours}h</div>
                        <p className="text-xs text-muted-foreground">
                            {projectTimeEntries.length} entries
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{estimatedCost.toFixed(0)}</div>
                        <p className="text-xs text-muted-foreground">
                            {project.hourlyRate ? `@ ₹${project.hourlyRate}/hr` : "No rate set"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Task Completion</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {projectTasks.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={completionData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {completionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                No tasks yet
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tasks by Priority</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tasksByPriority.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={tasksByPriority}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {tasksByPriority.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                No tasks yet
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Task List */}
            <Card>
                <CardHeader>
                    <CardTitle>Project Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                    {projectTasks.length > 0 ? (
                        <div className="space-y-2">
                            {projectTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between p-3 rounded-lg border"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium">{task.title}</div>
                                        {task.dueDate && (
                                            <div className="text-sm text-muted-foreground">
                                                Due: {formatDateShort(task.dueDate)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={task.completedAt ? "default" : "secondary"}>
                                            {task.completedAt ? "Done" : task.priority}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No tasks assigned to this project
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
