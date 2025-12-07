import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Sun,
  Moon,
  Monitor,
  Bell,
  Calendar,
  Palette,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  Dumbbell,
  Home,
  Star,
  Edit,
  Save,
  History,
  Clock,
} from "lucide-react";
import { showNotification } from "@/lib/pwa";
import { useTheme } from "@/lib/theme-provider";
import { useWorkspace } from "@/lib/workspace-context";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Workspace, InsertWorkspace, UserSettings, NotificationLog } from "@shared/schema";

const iconOptions = [
  { value: "briefcase", label: "Briefcase", icon: Briefcase },
  { value: "graduation-cap", label: "Education", icon: GraduationCap },
  { value: "dumbbell", label: "Fitness", icon: Dumbbell },
  { value: "home", label: "Home", icon: Home },
  { value: "star", label: "Star", icon: Star },
];

const colorOptions = [
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#F59E0B", label: "Orange" },
  { value: "#EF4444", label: "Red" },
  { value: "#EC4899", label: "Pink" },
];

function WorkspaceForm({
  workspace,
  onClose,
}: {
  workspace?: Workspace;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(workspace?.name || "");
  const [color, setColor] = useState(workspace?.color || "#3B82F6");
  const [icon, setIcon] = useState(workspace?.icon || "briefcase");

  const createMutation = useMutation({
    mutationFn: async (data: InsertWorkspace) => {
      return apiRequest("POST", "/api/workspaces", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      toast({ title: "Workspace created successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to create workspace", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Workspace>) => {
      return apiRequest("PATCH", `/api/workspaces/${workspace?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      toast({ title: "Workspace updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update workspace", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, color, icon };

    if (workspace) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data as InsertWorkspace);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workspace name..."
          required
          data-testid="input-workspace-name"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Icon</label>
        <div className="flex gap-2">
          {iconOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${icon === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
                  }`}
                onClick={() => setIcon(option.value)}
                data-testid={`icon-${option.value}`}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>
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

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} data-testid="button-save-workspace">
          {isPending ? "Saving..." : workspace ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function WorkspaceItem({
  workspace,
  onEdit,
  onDelete,
}: {
  workspace: Workspace;
  onEdit: (workspace: Workspace) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = iconOptions.find(i => i.value === workspace.icon)?.icon || Briefcase;

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover-elevate transition-all"
      data-testid={`workspace-settings-${workspace.id}`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: workspace.color + "20" }}
        >
          <Icon className="h-5 w-5" style={{ color: workspace.color }} />
        </div>
        <div>
          <p className="font-medium">{workspace.name}</p>
          {workspace.isDefault && (
            <p className="text-xs text-muted-foreground">Default workspace</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(workspace)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(workspace.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function GoogleOAuthCredentials({ workspaceId }: { workspaceId: string }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load existing credentials
  const { data: credentials, refetch: refetchCredentials } = useQuery({
    queryKey: [`/api/google-oauth/credentials/${workspaceId}`],
    queryFn: async () => {
      const response = await fetch(`/api/google-oauth/credentials/${workspaceId}`);
      const data = await response.json();
      if (data.configured) {
        setClientId(data.clientId);
      }
      return data;
    },
  });

  // Check connection status
  const { data: connectionStatus, refetch: refetchStatus } = useQuery({
    queryKey: [`/api/google-calendar/status`, user?.id, workspaceId],
    queryFn: async () => {
      if (!user?.id) return { connected: false };
      const response = await fetch(`/api/google-calendar/status?userId=${user.id}&workspaceId=${workspaceId}`);
      return await response.json();
    },
    enabled: !!user?.id,
  });

  const handleSave = async () => {
    if (!clientId || !clientSecret) {
      toast({ title: "Please fill in both fields", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await apiRequest("POST", "/api/google-oauth/credentials", {
        workspaceId,
        clientId,
        clientSecret,
      });

      toast({ title: "Credentials saved successfully!" });
      refetchCredentials();
    } catch (error) {
      toast({ title: "Failed to save credentials", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch(`/api/google-calendar/auth-url?userId=${user?.id}&workspaceId=${workspaceId}`);
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Failed to get auth URL", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to initiate connection", variant: "destructive" });
    }
  };

  const handleDisconnect = async () => {
    try {
      await apiRequest("POST", "/api/google-calendar/disconnect", { userId: user?.id });
      toast({ title: "Disconnected from Google Calendar" });
      refetchStatus();
    } catch (error) {
      toast({ title: "Failed to disconnect", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Client ID</label>
          <Input
            type="text"
            placeholder="Enter Google OAuth Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Client Secret</label>
          <Input
            type="password"
            placeholder="Enter Google OAuth Client Secret"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Redirect URI</label>
          <div className="flex gap-2">
            <Input
              value="http://localhost:7777/api/google-calendar/callback"
              readOnly
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText('http://localhost:7777/api/google-calendar/callback');
                toast({ title: "Copied to clipboard!" });
              }}
            >
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Add this to Google Cloud Console OAuth settings
          </p>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? "Saving..." : "Save Credentials"}
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-medium">Connection Status</h3>
        {credentials?.configured ? (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              {connectionStatus?.picture ? (
                <img src={connectionStatus.picture} alt="Profile" className="w-10 h-10 rounded-full" />
              ) : (
                <div className={`w-3 h-3 rounded-full ${connectionStatus?.connected ? "bg-green-500" : "bg-yellow-500"}`} />
              )}
              <div>
                <p className="font-medium">
                  {connectionStatus?.connected ? "Connected" : "Not Connected"}
                </p>
                {connectionStatus?.email && (
                  <p className="text-sm text-muted-foreground">{connectionStatus.email}</p>
                )}
                {!connectionStatus?.email && (
                  <p className="text-xs text-muted-foreground">
                    {connectionStatus?.connected
                      ? "Your Google Calendar events will be synced"
                      : "Connect your account to sync events"}
                  </p>
                )}
              </div>
            </div>
            {connectionStatus?.connected ? (
              <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={handleConnect}>
                Connect Google Calendar
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4 border rounded-lg bg-yellow-500/10 text-yellow-600 text-sm">
            Please configure your Client ID and Secret above to enable Google Calendar integration.
          </div>
        )}
      </div>

      <details className="border rounded-lg p-4">
        <summary className="cursor-pointer font-medium text-sm">
          📖 Setup Instructions
        </summary>
        <ol className="list-decimal list-inside space-y-2 mt-4 text-sm text-muted-foreground ml-2">
          <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a></li>
          <li>Create project → Enable Google Calendar API</li>
          <li>Create OAuth 2.0 Client ID (Web application)</li>
          <li>Add redirect URI above</li>
          <li>Copy Client ID & Secret here and save</li>
        </ol>
      </details>
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { workspaces, setWorkspaces, currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | undefined>();

  const { data: workspacesData } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
  });

  const [activeTab, setActiveTab] = useState("workspaces");

  const { data: userSettings, isLoading: settingsLoading } = useQuery<UserSettings>({
    queryKey: [`/api/user-settings?userId=${user?.id}`],
    enabled: !!user?.id,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      const res = await apiRequest("PATCH", "/api/user-settings", {
        userId: user?.id,
        ...updates
      });
      return await res.json() as UserSettings;
    },
    onSuccess: (data: UserSettings) => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-settings?userId=${user?.id}`] });
      toast({ title: "Settings updated" });
      // Apply theme immediately if changed
      if (data.theme && data.theme !== theme) {
        setTheme(data.theme as any);
      }
    },
    onError: () => {
      toast({ title: "Failed to update settings", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/workspaces/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      toast({ title: "Workspace deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete workspace", variant: "destructive" });
    },
  });

  const handleEdit = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingWorkspace(undefined);
  };

  const handleAddWorkspace = () => {
    setEditingWorkspace(undefined);
    setIsDialogOpen(true);
  };

  // Notification History Component
  const NotificationHistoryList = ({ userId }: { userId?: string }) => {
    const { data: logs, isLoading } = useQuery<NotificationLog[]>({
      queryKey: ["/api/notification-logs"],
      enabled: !!userId,
    });

    if (isLoading) {
      return <p className="text-sm text-muted-foreground">Loading notification history...</p>;
    }

    if (!logs || logs.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No notifications sent yet</p>
          <p className="text-sm">Notifications will appear here when tasks or events trigger reminders</p>
        </div>
      );
    }

    const getTypeBadge = (type: string) => {
      switch (type) {
        case 'event_reminder':
          return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">📅 Event</span>;
        case 'task_start':
          return <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">🔔 Task Start</span>;
        case 'task_deadline':
          return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">⚠️ Deadline</span>;
        default:
          return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">{type}</span>;
      }
    };

    const formatDate = (date: string | Date) => {
      const d = new Date(date);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString();
    };

    return (
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
            <div className="flex-shrink-0 mt-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {getTypeBadge(log.type)}
                <span className="text-xs text-muted-foreground">{formatDate(log.sentAt)}</span>
              </div>
              <p className="font-medium text-sm truncate">{log.title}</p>
              <p className="text-sm text-muted-foreground truncate">{log.body}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (settingsLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your LifeOS experience
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how LifeOS looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color scheme
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant={theme === "light" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => updateSettingsMutation.mutate({ theme: "light" })}
                data-testid="button-theme-light"
                className="w-full sm:w-auto"
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => updateSettingsMutation.mutate({ theme: "dark" })}
                data-testid="button-theme-dark"
                className="w-full sm:w-auto"
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => updateSettingsMutation.mutate({ theme: "system" })}
                data-testid="button-theme-system"
                className="w-full sm:w-auto"
              >
                <Monitor className="h-4 w-4 mr-2" />
                System
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Daily Quotes</p>
              <p className="text-sm text-muted-foreground">
                Display motivational quotes on dashboard
              </p>
            </div>
            <Switch
              checked={userSettings?.showQuotes ?? true}
              onCheckedChange={(checked) => updateSettingsMutation.mutate({ showQuotes: checked })}
              data-testid="switch-show-quotes"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive reminders for tasks, events, and habits
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!("Notification" in window)) {
                    toast({ title: "Notifications not supported", variant: "destructive" });
                    return;
                  }
                  Notification.requestPermission().then((permission) => {
                    if (permission === "granted") {
                      toast({ title: "Notifications enabled!" });
                      updateSettingsMutation.mutate({ notificationsEnabled: true });
                    } else {
                      toast({ title: "Permission denied", variant: "destructive" });
                      updateSettingsMutation.mutate({ notificationsEnabled: false });
                    }
                  });
                }}
              >
                Request Permission
              </Button>
              <Switch
                checked={userSettings?.notificationsEnabled ?? true}
                onCheckedChange={(checked) => updateSettingsMutation.mutate({ notificationsEnabled: checked })}
                data-testid="switch-notifications"
              />
            </div>
          </div>

          <Separator />

          <div>
            <p className="font-medium mb-2">Test Notification</p>
            <p className="text-sm text-muted-foreground mb-3">
              Send a test notification to verify your settings
            </p>
            <Button
              variant="outline"
              onClick={async () => {
                await showNotification("Test Notification", {
                  body: "If you can see this, notifications are working!",
                  icon: "/favicon.png",
                });
                toast({ title: "Notification sent!" });
              }}
              data-testid="button-test-notification"
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Test Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar
          </CardTitle>
          <CardDescription>
            Calendar and scheduling preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Week Starts On</p>
              <p className="text-sm text-muted-foreground">
                Choose the first day of the week
              </p>
            </div>
            <Select
              value={userSettings?.weekStartsOn?.toString() ?? "1"}
              onValueChange={(val) => updateSettingsMutation.mutate({ weekStartsOn: parseInt(val) })}
            >
              <SelectTrigger className="w-[140px]" data-testid="select-week-start">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sunday</SelectItem>
                <SelectItem value="1">Monday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Workspaces
            </CardTitle>
            <CardDescription>
              Manage your workspaces for different areas of life
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleAddWorkspace} data-testid="button-add-workspace-settings">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingWorkspace ? "Edit Workspace" : "Create Workspace"}
                </DialogTitle>
                <DialogDescription>
                  {editingWorkspace
                    ? "Update your workspace settings"
                    : "Create a new workspace to organize your life"
                  }
                </DialogDescription>
              </DialogHeader>
              <WorkspaceForm
                workspace={editingWorkspace}
                onClose={handleCloseDialog}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {workspacesData?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No workspaces yet</p>
            </div>
          ) : (
            workspacesData?.map((workspace) => (
              <WorkspaceItem
                key={workspace.id}
                workspace={workspace}
                onEdit={handleEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Notification History
          </CardTitle>
          <CardDescription>
            View recent notifications sent to your devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationHistoryList userId={user?.id} />
        </CardContent>
      </Card>

      {/* Google OAuth Credentials */}
      {currentWorkspace && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Google Calendar Credentials
            </CardTitle>
            <CardDescription>
              Configure Google OAuth for Calendar integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleOAuthCredentials workspaceId={currentWorkspace.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
