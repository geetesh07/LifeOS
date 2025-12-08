import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Calendar, Clock, X, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, addHours, addDays, format, startOfTomorrow } from "date-fns";
import type { Task } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useWorkspace } from "@/lib/workspace-context";

interface MissedDeadlinePromptProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MissedDeadlinePrompt({ open, onOpenChange }: MissedDeadlinePromptProps) {
    const { currentWorkspace } = useWorkspace();
    const queryClient = useQueryClient();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [rescheduleOption, setRescheduleOption] = useState<string>("1h");

    // Fetch all tasks
    const { data: tasks = [] } = useQuery<Task[]>({
        queryKey: ["/api/tasks", currentWorkspace?.id],
        queryFn: () => fetch(`/api/tasks?workspaceId=${currentWorkspace?.id}`).then(r => r.json()),
        enabled: !!currentWorkspace?.id,
    });

    // Filter for missed deadline tasks (dueDate in the past, not completed)
    const missedTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        // Task status is "done" or "cancelled" - skip
        // We check by looking for common done status names
        const isCompleted = task.completedAt != null;
        return dueDate < now && !isCompleted;
    });

    // Mutation to update task
    const updateTaskMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
            const res = await apiRequest("PATCH", `/api/tasks/${id}`, updates);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
            setSelectedTask(null);
        },
    });

    const getNewDeadline = () => {
        const now = new Date();
        switch (rescheduleOption) {
            case "1h": return addHours(now, 1);
            case "3h": return addHours(now, 3);
            case "tomorrow": return startOfTomorrow();
            case "1d": return addDays(now, 1);
            case "3d": return addDays(now, 3);
            case "1w": return addDays(now, 7);
            default: return addDays(now, 1);
        }
    };

    const handleReschedule = (task: Task) => {
        const newDeadline = getNewDeadline();
        updateTaskMutation.mutate({
            id: task.id,
            updates: {
                dueDate: newDeadline,
                reminderSent: false,
                reminder2Sent: false,
            }
        });
    };

    const handleMarkDone = (task: Task) => {
        updateTaskMutation.mutate({
            id: task.id,
            updates: {
                completedAt: new Date(),
            }
        });
    };

    const handleDismiss = (task: Task) => {
        // Just close without action - task stays as is
        setSelectedTask(null);
    };

    if (missedTasks.length === 0) {
        return null;
    }

    return (
        <>
            {/* Subtle floating indicator for missed tasks */}
            <button
                onClick={() => onOpenChange(true)}
                className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-background/95 backdrop-blur-sm border border-border shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 group"
            >
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">
                    {missedTasks.length} overdue
                </span>
            </button>

            {/* Main dialog */}
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[95vw] max-w-md sm:max-w-lg p-0 gap-0">
                    <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b bg-destructive/5">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            <DialogTitle className="text-base sm:text-lg">Missed Deadlines</DialogTitle>
                        </div>
                        <DialogDescription className="text-xs sm:text-sm">
                            {missedTasks.length} task{missedTasks.length > 1 ? 's' : ''} past deadline
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[60vh] sm:max-h-[400px]">
                        <div className="divide-y">
                            {missedTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="p-3 sm:p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-0.5 p-2 rounded-full bg-destructive/10">
                                            <Clock className="h-4 w-4 text-destructive" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{task.title}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Due {formatDistanceToNow(new Date(task.dueDate!), { addSuffix: true })}
                                            </p>

                                            {/* Action buttons */}
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs gap-1"
                                                    onClick={() => setSelectedTask(task)}
                                                >
                                                    <RotateCcw className="h-3 w-3" />
                                                    Reschedule
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs"
                                                    onClick={() => handleMarkDone(task)}
                                                >
                                                    Mark Done
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs text-muted-foreground"
                                                    onClick={() => handleDismiss(task)}
                                                >
                                                    Dismiss
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    <DialogFooter className="px-4 py-3 sm:px-6 border-t bg-muted/30">
                        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reschedule dialog */}
            <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
                <DialogContent className="w-[95vw] max-w-sm sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base">Reschedule Task</DialogTitle>
                        <DialogDescription className="text-sm truncate">
                            {selectedTask?.title}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">New deadline:</label>
                        <Select value={rescheduleOption} onValueChange={setRescheduleOption}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1h">In 1 hour</SelectItem>
                                <SelectItem value="3h">In 3 hours</SelectItem>
                                <SelectItem value="tomorrow">Tomorrow morning</SelectItem>
                                <SelectItem value="1d">In 1 day</SelectItem>
                                <SelectItem value="3d">In 3 days</SelectItem>
                                <SelectItem value="1w">In 1 week</SelectItem>
                            </SelectContent>
                        </Select>

                        <p className="text-xs text-muted-foreground mt-2">
                            New deadline: {format(getNewDeadline(), "PPP 'at' p")}
                        </p>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setSelectedTask(null)}>
                            Cancel
                        </Button>
                        <Button onClick={() => selectedTask && handleReschedule(selectedTask)}>
                            Reschedule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
