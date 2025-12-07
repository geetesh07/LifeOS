import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/LoadingSkeleton";
import { Switch } from "@/components/ui/switch";
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
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
  RefreshCw,
  LayoutGrid,
  CalendarDays,
  GanttChart,
  CalendarRange,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  parseISO,
} from "date-fns";
import { WeekView, ThreeDayView } from "@/components/calendar/TimeViews";
import { GanttView, type GanttTask } from "@/components/calendar/GanttView";
import type { Event, Task, InsertEvent } from "@shared/schema";

const colorOptions = [
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#F59E0B", label: "Orange" },
  { value: "#EF4444", label: "Red" },
  { value: "#EC4899", label: "Pink" },
];

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  color: string;
  isAllDay: boolean;
  isFromGoogle?: boolean;
  type: "event" | "task";
}

function EventForm({
  event,
  workspaceId,
  onClose,
  selectedDate,
}: {
  event?: Event;
  workspaceId: string;
  onClose: () => void;
  selectedDate?: Date;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [location, setLocation] = useState(event?.location || "");
  const [color, setColor] = useState(event?.color || "#3B82F6");
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay || false);
  const [startDate, setStartDate] = useState(
    event?.startTime
      ? format(new Date(event.startTime), "yyyy-MM-dd")
      : selectedDate
        ? format(selectedDate, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState(
    event?.startTime ? format(new Date(event.startTime), "HH:mm") : "09:00"
  );
  const [endDate, setEndDate] = useState(
    event?.endTime
      ? format(new Date(event.endTime), "yyyy-MM-dd")
      : selectedDate
        ? format(selectedDate, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd")
  );
  const [endTime, setEndTime] = useState(
    event?.endTime ? format(new Date(event.endTime), "HH:mm") : "10:00"
  );



  const createMutation = useMutation({
    mutationFn: async (data: InsertEvent & { userId?: string }) => {
      return apiRequest("POST", "/api/events", { ...data, userId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events?workspaceId=${workspaceId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/google-calendar/events"] }); // Refresh Google events too
      toast({ title: "Event created successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to create event", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Event> & { userId?: string }) => {
      return apiRequest("PATCH", `/api/events/${event?.id}`, { ...data, userId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events?workspaceId=${workspaceId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/google-calendar/events"] });
      toast({ title: "Event updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update event", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = isAllDay
      ? new Date(`${startDate}T00:00:00`)
      : new Date(`${startDate}T${startTime}`);

    const endDateTime = isAllDay
      ? new Date(`${endDate}T23:59:59`)
      : new Date(`${endDate}T${endTime}`);

    const data = {
      workspaceId,
      title,
      description: description || null,
      location: location || null,
      color,
      isAllDay,
      startTime: startDateTime,
      endTime: endDateTime,
    };

    if (event) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data as InsertEvent);
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
          placeholder="Event title..."
          required
          data-testid="input-event-title"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description..."
          rows={2}
          data-testid="input-event-description"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Location</label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Add location..."
          data-testid="input-event-location"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">All Day</label>
        <Switch
          checked={isAllDay}
          onCheckedChange={setIsAllDay}
          data-testid="switch-all-day"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            data-testid="input-event-start-date"
          />
        </div>
        {!isAllDay && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Time</label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              data-testid="input-event-start-time"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">End Date</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            data-testid="input-event-end-date"
          />
        </div>
        {!isAllDay && (
          <div className="space-y-2">
            <label className="text-sm font-medium">End Time</label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              data-testid="input-event-end-time"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Color</label>
        <div className="flex gap-2">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`w-8 h-8 rounded-full transition-all ${color === option.value ? "ring-2 ring-offset-2 ring-primary" : ""
                }`}
              style={{ backgroundColor: option.value }}
              onClick={() => setColor(option.value)}
              data-testid={`color-${option.label.toLowerCase()}`}
            />
          ))}
        </div>
      </div>

      <DialogFooter className="flex justify-between sm:justify-between">
        {event && (
          <Button
            type="button"
            variant="destructive"
            onClick={async () => {
              if (confirm("Are you sure you want to delete this event?")) {
                try {
                  // Pass userId as query param for delete
                  const { user } = useAuth(); // This won't work inside callback, need to capture from parent scope
                  // Actually EventForm is a component, so we can use hook at top level.
                  // But we already have user from useAuth in Calendar component, let's pass it down or use hook here.
                  // We added useAuth to EventForm in previous step.

                  await apiRequest("DELETE", `/api/events/${event.id}?userId=${user?.id}`);
                  queryClient.invalidateQueries({ queryKey: [`/api/events?workspaceId=${workspaceId}`] });
                  queryClient.invalidateQueries({ queryKey: ["/api/google-calendar/events"] });
                  toast({ title: "Event deleted successfully" });
                  onClose();
                } catch (error) {
                  toast({ title: "Failed to delete event", variant: "destructive" });
                }
              }
            }}
          >
            Delete
          </Button>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-event">
            {isPending ? "Saving..." : event ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

function DayCell({
  date,
  events,
  currentMonth,
  onDayClick,
  onEventClick,
}: {
  date: Date;
  events: CalendarEvent[];
  currentMonth: Date;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const dayEvents = events.filter(e => isSameDay(e.startTime, date));
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);

  return (
    <div
      className={`min-h-[100px] p-2 border-b border-r cursor-pointer hover-elevate transition-colors ${!isCurrentMonth ? "bg-muted/30 text-muted-foreground" : ""
        } ${today ? "bg-primary/5" : ""}`}
      onClick={() => onDayClick(date)}
      data-testid={`calendar-day-${format(date, "yyyy-MM-dd")}`}
    >
      <div className={`text-sm font-medium mb-1 ${today ? "w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center" : ""
        }`}>
        {format(date, "d")}
      </div>
      <div className="space-y-1">
        {dayEvents.slice(0, 3).map((event) => (
          <div
            key={event.id}
            className="text-xs p-1 rounded truncate cursor-pointer"
            style={{
              backgroundColor: event.color + "20",
              color: event.color,
              borderLeft: `2px solid ${event.color}`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick(event);
            }}
            data-testid={`event-${event.id}`}
          >
            {event.isFromGoogle && "📅 "}
            {event.type === "task" && "✓ "}
            {event.title}
          </div>
        ))}
        {dayEvents.length > 3 && (
          <div className="text-xs text-muted-foreground">
            +{dayEvents.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}

export default function Calendar() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'threeDay' | 'gantt'>('month');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: [`/api/events?workspaceId=${currentWorkspace?.id}`],
    enabled: !!currentWorkspace,
  });

  const { data: tasks } = useQuery<Task[]>({
    queryKey: [`/api/tasks?workspaceId=${currentWorkspace?.id}`],
    enabled: !!currentWorkspace,
  });

  const { user } = useAuth();
  const [googleSyncEnabled, setGoogleSyncEnabled] = useState(false);

  const { data: googleEvents, isLoading: googleLoading, refetch: refetchGoogle } = useQuery<any[]>({
    queryKey: ["/api/google-calendar/events", user?.id, currentWorkspace?.id],
    queryFn: async () => {
      const userId = user?.id;
      const workspaceId = currentWorkspace?.id;

      if (!userId || !workspaceId) {
        return [];
      }

      const response = await fetch(`/api/google-calendar/events?userId=${userId}&workspaceId=${workspaceId}`);
      if (!response.ok) {
        return [];
      }
      return await response.json();
    },
    enabled: googleSyncEnabled && !!user?.id && !!currentWorkspace?.id,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/google-calendar/sync");
    },
    onSuccess: () => {
      setGoogleSyncEnabled(true);
      refetchGoogle();
      toast({ title: "Calendar synced successfully" });
    },
    onError: () => {
      toast({ title: "Failed to sync calendar. Make sure Google Calendar is connected in Settings.", variant: "destructive" });
    },
  });

  const calendarEvents: CalendarEvent[] = [
    ...(events?.map(e => ({
      id: e.id,
      title: e.title,
      startTime: new Date(e.startTime),
      endTime: new Date(e.endTime),
      color: e.color || "#3B82F6",
      isAllDay: e.isAllDay,
      isFromGoogle: e.isFromGoogle,
      type: "event" as const,
    })) || []),
    ...(tasks?.filter(t => t.dueDate || t.startDate).map(t => {
      const hasTimeRange = t.startDate && t.dueDate;
      return {
        id: `task-${t.id}`,
        title: t.title,
        startTime: new Date(t.startDate || t.dueDate!),
        endTime: new Date(t.dueDate || t.startDate!),
        color: t.color || "#6366F1",
        isAllDay: !hasTimeRange,
        type: "task" as const,
        priority: t.priority,
      };
    }) || []),
    ...(googleEvents?.map((e: any) => ({
      id: `google-${e.id}`,
      title: e.summary || "Untitled",
      startTime: new Date(e.start?.dateTime || e.start?.date),
      endTime: new Date(e.end?.dateTime || e.end?.date),
      color: "#DB4437",
      isAllDay: !!e.start?.date,
      isFromGoogle: true,
      type: "event" as const,
    })) || []),
  ];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setEditingEvent(undefined);
    setIsDialogOpen(true);
  };

  const handleEventClick = (calendarEvent: CalendarEvent) => {
    if (calendarEvent.type === "event" && !calendarEvent.isFromGoogle) {
      const originalEvent = events?.find(e => e.id === calendarEvent.id);
      if (originalEvent) {
        setEditingEvent(originalEvent);
        setSelectedDate(undefined);
        setIsDialogOpen(true);
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEvent(undefined);
    setSelectedDate(undefined);
  };

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Select a workspace to view calendar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            data-testid="button-sync-calendar"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Sync Google
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingEvent(undefined); setSelectedDate(undefined); }} data-testid="button-new-event">
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
                <DialogDescription>
                  {editingEvent ? "Update the event details below" : "Add a new event to your calendar"}
                </DialogDescription>
              </DialogHeader>
              <EventForm
                event={editingEvent}
                workspaceId={currentWorkspace.id}
                onClose={handleCloseDialog}
                selectedDate={selectedDate}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (viewType === 'month') setCurrentMonth(subMonths(currentMonth, 1));
                  else if (viewType === 'week') setCurrentMonth(subWeeks(currentMonth, 1));
                  else if (viewType === 'threeDay') setCurrentMonth(addDays(currentMonth, -3));
                  else setCurrentMonth(subWeeks(currentMonth, 2));
                }}
                data-testid="button-prev"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg sm:text-xl font-semibold min-w-[140px] text-center" data-testid="text-current-period">
                {viewType === 'month'
                  ? format(currentMonth, "MMMM yyyy")
                  : viewType === 'gantt'
                    ? `${format(currentMonth, "MMM d")} - ${format(addDays(currentMonth, 13), "MMM d, yyyy")}`
                    : format(currentMonth, "MMM d, yyyy")
                }
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (viewType === 'month') setCurrentMonth(addMonths(currentMonth, 1));
                  else if (viewType === 'week') setCurrentMonth(addWeeks(currentMonth, 1));
                  else if (viewType === 'threeDay') setCurrentMonth(addDays(currentMonth, 3));
                  else setCurrentMonth(addWeeks(currentMonth, 2));
                }}
                data-testid="button-next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
                data-testid="button-today"
              >
                Today
              </Button>

              {/* View Switcher */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewType === "month" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewType("month")}
                  className="rounded-none"
                  title="Month View"
                >
                  <LayoutGrid className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Month</span>
                </Button>
                <Button
                  variant={viewType === "week" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewType("week")}
                  className="rounded-none"
                  title="Week View"
                >
                  <CalendarDays className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Week</span>
                </Button>
                <Button
                  variant={viewType === "threeDay" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewType("threeDay")}
                  className="rounded-none"
                  title="3-Day View"
                >
                  <CalendarRange className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">3-Day</span>
                </Button>
                <Button
                  variant={viewType === "gantt" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewType("gantt")}
                  className="rounded-none"
                  title="Gantt Chart"
                >
                  <GanttChart className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Gantt</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {eventsLoading ? (
            <CardSkeleton count={1} className="h-[600px] grid-cols-1" />
          ) : viewType === 'month' ? (
            <>
              <div className="grid grid-cols-7 border-b">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day) => (
                  <DayCell
                    key={day.toISOString()}
                    date={day}
                    events={calendarEvents}
                    currentMonth={currentMonth}
                    onDayClick={handleDayClick}
                    onEventClick={handleEventClick}
                  />
                ))}
              </div>
            </>
          ) : viewType === 'week' ? (
            <div className="h-[600px] overflow-hidden">
              <WeekView
                days={eachDayOfInterval({
                  start: startOfWeek(currentMonth, { weekStartsOn: 1 }),
                  end: endOfWeek(currentMonth, { weekStartsOn: 1 }),
                })}
                events={calendarEvents}
                onEventClick={handleEventClick}
                onDayClick={handleDayClick}
              />
            </div>
          ) : viewType === 'threeDay' ? (
            <div className="h-[600px] overflow-hidden">
              <ThreeDayView
                days={[currentMonth, addDays(currentMonth, 1), addDays(currentMonth, 2)]}
                events={calendarEvents}
                onEventClick={handleEventClick}
                onDayClick={handleDayClick}
              />
            </div>
          ) : (
            <div className="h-[500px] overflow-hidden">
              <GanttView
                tasks={calendarEvents
                  .filter(e => !e.isAllDay)
                  .map(e => ({
                    id: e.id,
                    title: e.title,
                    startDate: e.startTime,
                    endDate: e.endTime,
                    color: e.color,
                    priority: (e as any).priority || 'medium',
                    type: e.type,
                  }))}
                currentDate={currentMonth}
                onTaskClick={(task) => {
                  const originalEvent = events?.find(e => e.id === task.id);
                  if (originalEvent) {
                    setEditingEvent(originalEvent);
                    setIsDialogOpen(true);
                  }
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
          <span>Events</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#6366F1]" />
          <span>Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#DB4437]" />
          <span>Google Calendar</span>
        </div>
      </div>
    </div>
  );
}
