import { useMemo } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, TaskStatus } from "@shared/schema";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MoreHorizontal, Flag } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useState } from "react";
import { useTheme } from "@/lib/theme-provider";
import { getColumnBackgroundColor, getColumnTextColor, getCardBackgroundOnColumn } from "@/lib/color-utils";

interface EnhancedKanbanProps {
    tasks: Task[];
    statuses: TaskStatus[];
    onTaskMove: (taskId: string, newStatusId: string) => void;
    onTaskEdit: (task: Task) => void;
    onTaskDelete: (taskId: string) => void;
}

interface SortableTaskCardProps {
    task: Task;
    statusColor: string;
    onEdit: () => void;
    onDelete: () => void;
}

function SortableTaskCard({ task, statusColor, onEdit, onDelete }: SortableTaskCardProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const priorityColors = {
        low: "bg-blue-500",
        medium: "bg-yellow-500",
        high: "bg-orange-500",
        urgent: "bg-red-500",
    };

    // Use status color for card background
    const cardBgColor = getColumnBackgroundColor(statusColor, isDark);
    const cardTextColor = getColumnTextColor(statusColor, isDark);

    return (
        <Card
            ref={setNodeRef}
            style={{
                ...style,
                backgroundColor: cardBgColor,
                color: cardTextColor,
                border: 'none',
            }}
            {...attributes}
            {...listeners}
            className="mb-2 cursor-move hover:shadow-lg transition-all"
        >
            <CardHeader className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-2 line-clamp-2">{task.title}</h4>
                        {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {task.description}
                            </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            {task.priority !== "medium" && (
                                <Badge variant="secondary" className="gap-1">
                                    <Flag className={`h-3 w-3 ${priorityColors[task.priority as keyof typeof priorityColors]}`} />
                                    {task.priority}
                                </Badge>
                            )}
                            {task.dueDate && (
                                <Badge variant="outline" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(task.dueDate), "dd MMM")}
                                </Badge>
                            )}
                            {task.estimatedMinutes && (
                                <Badge variant="outline">
                                    {Math.floor(task.estimatedMinutes / 60)}h {task.estimatedMinutes % 60}m
                                </Badge>
                            )}
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={onDelete} className="text-destructive">
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
        </Card>
    );
}

interface DroppableStatusColumnProps {
    status: TaskStatus;
    tasks: Task[];
    onEdit: (task: Task) => void;
    onDelete: (taskId: string) => void;
}

function DroppableStatusColumn({ status, tasks, onEdit, onDelete }: DroppableStatusColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: status.id,
    });

    return (
        <div
            key={status.id}
            className="flex-shrink-0 w-80"
        >
            <div
                ref={setNodeRef}
                className={`bg-muted/30 rounded-lg p-4 h-full transition-colors ${isOver ? 'bg-muted/50 ring-2 ring-primary' : ''
                    }`}
            >
                <div className="flex items-center gap-2 mb-4">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: status.color }}
                    />
                    <h3 className="font-semibold text-sm">{status.name}</h3>
                    <Badge variant="secondary" className="ml-auto">
                        {tasks.length || 0}
                    </Badge>
                </div>

                <SortableContext
                    items={tasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                    id={status.id}
                >
                    <div className="min-h-[200px]">
                        {tasks.map((task) => (
                            <SortableTaskCard
                                key={task.id}
                                task={task}
                                statusColor={status.color}
                                onEdit={() => onEdit(task)}
                                onDelete={() => onDelete(task.id)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}

export function EnhancedKanban({ tasks, statuses, onTaskMove, onTaskEdit, onTaskDelete }: EnhancedKanbanProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const tasksByStatus = useMemo(() => {
        const grouped: Record<string, Task[]> = {};
        statuses.forEach(status => {
            grouped[status.id] = tasks.filter(
                task => task.statusId === status.id || (!task.statusId && status.isDefault)
            );
        });
        return grouped;
    }, [tasks, statuses]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const taskId = active.id as string;
        const overId = over.id as string;

        // Check if dropped directly on a status column
        let targetStatusId = statuses.find(s => s.id === overId)?.id;

        // If not dropped on a status column, check if dropped on a task
        if (!targetStatusId) {
            // Find which status column the dropped task belongs to
            const targetTask = tasks.find(t => t.id === overId);
            if (targetTask) {
                targetStatusId = targetTask.statusId || statuses.find(s => s.isDefault)?.id;
            }
        }

        if (targetStatusId) {
            console.log(`[Kanban] Moving task ${taskId} to status ${targetStatusId}`);
            onTaskMove(taskId, targetStatusId);
        }

        setActiveId(null);
    };

    const activeTask = tasks.find(t => t.id === activeId);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4">
                {statuses.map((status) => (
                    <DroppableStatusColumn
                        key={status.id}
                        status={status}
                        tasks={tasksByStatus[status.id] || []}
                        onEdit={onTaskEdit}
                        onDelete={onTaskDelete}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeTask ? (
                    <Card className="w-80 opacity-90">
                        <CardHeader className="p-4">
                            <h4 className="font-medium text-sm">{activeTask.title}</h4>
                        </CardHeader>
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
