import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, X, Check, Clock, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import type { NotificationLog } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const LAST_READ_KEY = "notification_last_read";

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [lastReadTime, setLastReadTime] = useState<number>(() => {
        const stored = localStorage.getItem(LAST_READ_KEY);
        return stored ? parseInt(stored, 10) : 0;
    });
    const queryClient = useQueryClient();

    // Fetch notification logs
    const { data: notifications = [], isLoading } = useQuery<NotificationLog[]>({
        queryKey: ["/api/notification-logs?limit=20"],
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    // Count unread (notifications after last read time)
    const unreadCount = notifications.filter(
        (n) => new Date(n.sentAt).getTime() > lastReadTime
    ).length;

    const handleMarkAllRead = () => {
        const now = Date.now();
        localStorage.setItem(LAST_READ_KEY, now.toString());
        setLastReadTime(now);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "task_start":
                return <Clock className="h-4 w-4 text-blue-500" />;
            case "task_deadline":
                return <Clock className="h-4 w-4 text-red-500" />;
            case "event_reminder":
                return <Calendar className="h-4 w-4 text-purple-500" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "task_start":
                return (
                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                        Start
                    </Badge>
                );
            case "task_deadline":
                return (
                    <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/20">
                        Deadline
                    </Badge>
                );
            case "event_reminder":
                return (
                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">
                        Event
                    </Badge>
                );
            default:
                return null;
        }
    };

    const isUnread = (notification: NotificationLog) => {
        return new Date(notification.sentAt).getTime() > lastReadTime;
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9"
                    aria-label="Notifications"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium animate-pulse">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-[90vw] sm:w-[380px] p-0"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={handleMarkAllRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Notification List */}
                <ScrollArea className="h-[60vh] sm:h-[400px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                            <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                            <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                                Notifications will appear here when you receive reminders
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`px-4 py-3 hover:bg-muted/50 transition-colors ${isUnread(notification) ? "bg-primary/5" : ""
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 p-2 rounded-full bg-muted">
                                            {getTypeIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {getTypeBadge(notification.type)}
                                                {isUnread(notification) && (
                                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium truncate">{notification.title}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                {notification.body}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="p-3 border-t bg-muted/30">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => {
                                setIsOpen(false);
                                window.location.href = "/settings";
                            }}
                        >
                            View all in Settings
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

