import { format, isSameDay } from "date-fns";

export interface GanttTask {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    color: string;
    priority: string;
    type: "task" | "event";
}

interface GanttViewProps {
    tasks: GanttTask[];
    currentDate: Date;
    onTaskClick: (task: GanttTask) => void;
}

const HOUR_WIDTH = 80; // Wider columns for better visibility

export function GanttView({ tasks, currentDate, onTaskClick }: GanttViewProps) {
    const now = new Date();
    const currentHour = now.getHours();
    const isToday = isSameDay(currentDate, now);

    // Show hours from current hour (if today) or from 6 AM, until midnight
    const startHour = isToday ? currentHour : 6;
    const HOURS = Array.from({ length: 24 - startHour }, (_, i) => i + startHour);

    const totalWidth = HOURS.length * HOUR_WIDTH;

    // Calculate position and width for a task on the timeline
    function getTaskStyle(task: GanttTask) {
        const taskStartHour = task.startDate.getHours() + task.startDate.getMinutes() / 60;
        const taskEndHour = task.endDate.getHours() + task.endDate.getMinutes() / 60;

        // Only show tasks that are on the current date
        if (!isSameDay(task.startDate, currentDate) && !isSameDay(task.endDate, currentDate)) {
            return null;
        }

        // Adjust for our visible hour range
        const visibleStartHour = Math.max(taskStartHour, startHour);
        const visibleEndHour = Math.max(taskEndHour, startHour);

        // If task ends before our visible range, don't show it
        if (visibleEndHour <= startHour) return null;

        const left = (visibleStartHour - startHour) * HOUR_WIDTH;
        const width = Math.max(60, (visibleEndHour - visibleStartHour) * HOUR_WIDTH);

        // Check if task is in progress
        const isActive = isToday && taskStartHour <= currentHour + now.getMinutes() / 60 && taskEndHour > currentHour + now.getMinutes() / 60;

        // Check if task deadline is missed
        const isMissed = isToday && taskEndHour < currentHour + now.getMinutes() / 60;

        return { left, width, isActive, isMissed };
    }

    // Filter and sort tasks
    const visibleTasks = tasks
        .filter(t => {
            const style = getTaskStyle(t);
            return style !== null;
        })
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            {/* Header - Date display */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                <h3 className="text-lg font-semibold">
                    {format(currentDate, "EEEE, MMMM d, yyyy")}
                </h3>
                {isToday && (
                    <span className="text-sm text-primary font-medium">
                        📍 Now: {format(now, "h:mm a")}
                    </span>
                )}
            </div>

            {/* Time header */}
            <div className="flex border-b sticky top-0 bg-background z-20">
                <div className="w-56 flex-shrink-0 p-3 border-r font-medium text-sm bg-muted/20">
                    Task / Event
                </div>
                <div className="flex-1 overflow-x-auto">
                    <div className="flex" style={{ minWidth: `${totalWidth}px` }}>
                        {HOURS.map((hour) => (
                            <div
                                key={hour}
                                className={`flex-shrink-0 p-2 text-center border-r text-sm font-medium ${hour === currentHour && isToday
                                        ? "bg-primary/20 text-primary"
                                        : ""
                                    }`}
                                style={{ width: `${HOUR_WIDTH}px` }}
                            >
                                {format(new Date().setHours(hour, 0), "h a")}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Task rows */}
            <div className="flex-1 overflow-auto">
                {visibleTasks.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                        <div className="text-center">
                            <p className="text-lg">No upcoming tasks for today</p>
                            <p className="text-sm">
                                {isToday
                                    ? "Tasks that have already passed are hidden"
                                    : "Add start and end times to tasks to see them here"}
                            </p>
                        </div>
                    </div>
                ) : (
                    visibleTasks.map((task) => {
                        const style = getTaskStyle(task);
                        if (!style) return null;

                        return (
                            <div key={task.id} className="flex border-b hover:bg-muted/30">
                                {/* Task name */}
                                <div
                                    className="w-56 flex-shrink-0 p-3 border-r flex items-center gap-2 cursor-pointer bg-muted/10"
                                    onClick={() => onTaskClick(task)}
                                >
                                    <div
                                        className={`w-3 h-3 rounded-full flex-shrink-0 ${style.isActive ? 'animate-pulse' : ''}`}
                                        style={{ backgroundColor: style.isMissed ? '#EF4444' : task.color }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <span className={`text-sm truncate font-medium block ${style.isMissed ? 'text-red-500' : ''}`}>
                                            {task.title}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {format(task.startDate, "h:mm a")} - {format(task.endDate, "h:mm a")}
                                        </span>
                                    </div>
                                    {style.isActive && (
                                        <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">LIVE</span>
                                    )}
                                    {style.isMissed && (
                                        <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">MISSED</span>
                                    )}
                                </div>

                                {/* Timeline bar area */}
                                <div className="flex-1 relative h-16 overflow-x-auto">
                                    <div className="absolute inset-0" style={{ minWidth: `${totalWidth}px` }}>
                                        {/* Hour grid lines */}
                                        <div className="absolute inset-0 flex">
                                            {HOURS.map((hour) => (
                                                <div
                                                    key={hour}
                                                    className={`flex-shrink-0 border-r h-full ${hour === currentHour && isToday
                                                            ? "bg-primary/10"
                                                            : ""
                                                        }`}
                                                    style={{ width: `${HOUR_WIDTH}px` }}
                                                />
                                            ))}
                                        </div>

                                        {/* Current time indicator */}
                                        {isToday && (
                                            <div
                                                className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                                                style={{
                                                    left: `${(currentHour - startHour + now.getMinutes() / 60) * HOUR_WIDTH}px`
                                                }}
                                            />
                                        )}

                                        {/* Task bar */}
                                        <div
                                            className={`absolute top-2 bottom-2 rounded-lg cursor-pointer 
                               flex items-center px-3 shadow-md hover:opacity-90 transition-all
                               hover:shadow-lg ${style.isActive ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                            style={{
                                                left: `${style.left}px`,
                                                width: `${style.width}px`,
                                                backgroundColor: style.isMissed ? '#EF4444' : task.color,
                                            }}
                                            onClick={() => onTaskClick(task)}
                                        >
                                            <span className="text-sm text-white truncate font-medium">
                                                {task.title}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 p-3 border-t bg-muted/20 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                    <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Missed Deadline</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#6366F1]" />
                    <span>Tasks</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
                    <span>Events</span>
                </div>
                {isToday && (
                    <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                        <div className="w-0.5 h-3 bg-primary" />
                        <span>Current time</span>
                    </div>
                )}
            </div>
        </div>
    );
}
