import { format, isSameDay } from "date-fns";

export interface CalendarEvent {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    color: string;
    isAllDay: boolean;
    isFromGoogle?: boolean;
    type: "event" | "task";
    priority?: string;
}

interface TimeSlotViewProps {
    days: Date[];
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
    onDayClick: (date: Date) => void;
}

const HOUR_HEIGHT = 50; // pixels per hour
const START_HOUR = 0; // 12 AM (midnight)
const END_HOUR = 24; // 12 AM next day
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

// Calculate position and height for an event
function getEventStyle(event: CalendarEvent) {
    const startHour = event.startTime.getHours() + event.startTime.getMinutes() / 60;
    const endHour = event.endTime.getHours() + event.endTime.getMinutes() / 60;

    const top = Math.max(0, (startHour - START_HOUR) * HOUR_HEIGHT);
    const height = Math.max(25, (endHour - startHour) * HOUR_HEIGHT);

    return { top, height };
}

export function WeekView({ days, events, onEventClick, onDayClick }: TimeSlotViewProps) {
    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header with days */}
            <div className="flex border-b sticky top-0 bg-background z-10">
                <div className="w-16 flex-shrink-0 border-r" />
                {days.map((day) => (
                    <div
                        key={day.toISOString()}
                        className={`flex-1 p-2 text-center border-r last:border-r-0 cursor-pointer hover:bg-muted/50 transition-colors min-w-[80px] ${isSameDay(day, new Date()) ? "bg-primary/10" : ""
                            }`}
                        onClick={() => onDayClick(day)}
                    >
                        <div className="text-xs text-muted-foreground uppercase">
                            {format(day, "EEE")}
                        </div>
                        <div className={`text-lg font-semibold ${isSameDay(day, new Date()) ? "text-primary" : ""}`}>
                            {format(day, "d")}
                        </div>
                    </div>
                ))}
            </div>

            {/* All-day events row */}
            <div className="flex border-b bg-muted/30">
                <div className="w-16 flex-shrink-0 border-r p-1 text-xs text-muted-foreground text-center">
                    All day
                </div>
                {days.map((day) => {
                    const allDayEvents = events.filter(
                        (e) => e.isAllDay && isSameDay(e.startTime, day)
                    );
                    return (
                        <div
                            key={day.toISOString()}
                            className="flex-1 p-1 border-r last:border-r-0 min-h-[32px] space-y-1 min-w-[80px]"
                        >
                            {allDayEvents.slice(0, 2).map((event) => (
                                <div
                                    key={event.id}
                                    className="text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                                    style={{
                                        backgroundColor: event.color + "30",
                                        color: event.color,
                                        borderLeft: `3px solid ${event.color}`,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEventClick(event);
                                    }}
                                >
                                    {event.type === "task" && "✓ "}
                                    {event.title}
                                </div>
                            ))}
                            {allDayEvents.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                    +{allDayEvents.length - 2} more
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Time grid */}
            <div className="flex flex-1 overflow-auto">
                {/* Time labels */}
                <div className="w-16 flex-shrink-0 border-r">
                    {HOURS.map((hour) => (
                        <div
                            key={hour}
                            className="text-xs text-muted-foreground text-right pr-2 flex items-start justify-end"
                            style={{ height: `${HOUR_HEIGHT}px` }}
                        >
                            {format(new Date().setHours(hour, 0), "h a")}
                        </div>
                    ))}
                </div>

                {/* Day columns */}
                {days.map((day) => {
                    const dayEvents = events.filter(
                        (e) => !e.isAllDay && isSameDay(e.startTime, day)
                    );

                    return (
                        <div
                            key={day.toISOString()}
                            className="flex-1 border-r last:border-r-0 relative min-w-[80px]"
                            onClick={() => onDayClick(day)}
                        >
                            {/* Hour lines */}
                            {HOURS.map((hour) => (
                                <div
                                    key={hour}
                                    className="border-b border-dashed border-muted hover:bg-muted/30 transition-colors"
                                    style={{ height: `${HOUR_HEIGHT}px` }}
                                />
                            ))}

                            {/* Events */}
                            {dayEvents.map((event) => {
                                const { top, height } = getEventStyle(event);
                                return (
                                    <div
                                        key={event.id}
                                        className="absolute left-1 right-1 rounded-md px-2 py-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                                        style={{
                                            top: `${top}px`,
                                            height: `${Math.max(height, 20)}px`,
                                            backgroundColor: event.color + "E0",
                                            color: "#fff",
                                            zIndex: 10,
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event);
                                        }}
                                    >
                                        <div className="text-xs font-medium truncate">
                                            {event.type === "task" && "✓ "}
                                            {event.isFromGoogle && "📅 "}
                                            {event.title}
                                        </div>
                                        {height > 30 && (
                                            <div className="text-xs opacity-80 truncate">
                                                {format(event.startTime, "h:mm a")} - {format(event.endTime, "h:mm a")}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function ThreeDayView({ days, events, onEventClick, onDayClick }: TimeSlotViewProps) {
    const threeDays = days.slice(0, 3);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header with days */}
            <div className="flex border-b sticky top-0 bg-background z-10">
                <div className="w-20 flex-shrink-0 border-r" />
                {threeDays.map((day) => (
                    <div
                        key={day.toISOString()}
                        className={`flex-1 p-3 text-center border-r last:border-r-0 cursor-pointer hover:bg-muted/50 transition-colors ${isSameDay(day, new Date()) ? "bg-primary/10" : ""
                            }`}
                        onClick={() => onDayClick(day)}
                    >
                        <div className="text-sm text-muted-foreground uppercase font-medium">
                            {format(day, "EEEE")}
                        </div>
                        <div className={`text-2xl font-bold ${isSameDay(day, new Date()) ? "text-primary" : ""}`}>
                            {format(day, "d")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {format(day, "MMM")}
                        </div>
                    </div>
                ))}
            </div>

            {/* All-day events */}
            <div className="flex border-b bg-muted/30">
                <div className="w-20 flex-shrink-0 border-r p-2 text-sm text-muted-foreground text-center font-medium">
                    All Day
                </div>
                {threeDays.map((day) => {
                    const allDayEvents = events.filter(
                        (e) => e.isAllDay && isSameDay(e.startTime, day)
                    );
                    return (
                        <div
                            key={day.toISOString()}
                            className="flex-1 p-2 border-r last:border-r-0 min-h-[40px] space-y-1"
                        >
                            {allDayEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="text-sm px-2 py-1 rounded cursor-pointer hover:opacity-80"
                                    style={{
                                        backgroundColor: event.color + "30",
                                        color: event.color,
                                        borderLeft: `4px solid ${event.color}`,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEventClick(event);
                                    }}
                                >
                                    {event.type === "task" && "✓ "}
                                    {event.title}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>

            {/* Time grid */}
            <div className="flex flex-1 overflow-auto">
                <div className="w-20 flex-shrink-0 border-r">
                    {HOURS.map((hour) => (
                        <div
                            key={hour}
                            className="text-sm text-muted-foreground text-right pr-3 font-medium flex items-start justify-end"
                            style={{ height: `${HOUR_HEIGHT}px` }}
                        >
                            {format(new Date().setHours(hour, 0), "h a")}
                        </div>
                    ))}
                </div>

                {threeDays.map((day) => {
                    const dayEvents = events.filter(
                        (e) => !e.isAllDay && isSameDay(e.startTime, day)
                    );

                    return (
                        <div
                            key={day.toISOString()}
                            className="flex-1 border-r last:border-r-0 relative"
                            onClick={() => onDayClick(day)}
                        >
                            {HOURS.map((hour) => (
                                <div
                                    key={hour}
                                    className="border-b border-dashed border-muted hover:bg-muted/30 transition-colors"
                                    style={{ height: `${HOUR_HEIGHT}px` }}
                                />
                            ))}

                            {dayEvents.map((event) => {
                                const { top, height } = getEventStyle(event);
                                return (
                                    <div
                                        key={event.id}
                                        className="absolute left-2 right-2 rounded-lg px-3 py-2 overflow-hidden cursor-pointer hover:opacity-90 transition-all shadow-md"
                                        style={{
                                            top: `${top}px`,
                                            height: `${Math.max(height, 25)}px`,
                                            backgroundColor: event.color,
                                            color: "#fff",
                                            zIndex: 10,
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event);
                                        }}
                                    >
                                        <div className="font-medium truncate">
                                            {event.type === "task" && "✓ "}
                                            {event.isFromGoogle && "📅 "}
                                            {event.title}
                                        </div>
                                        {height > 40 && (
                                            <div className="text-sm opacity-90">
                                                {format(event.startTime, "h:mm a")} - {format(event.endTime, "h:mm a")}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
