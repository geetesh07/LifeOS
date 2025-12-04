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
} from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useWorkspace } from "@/lib/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Workspace, InsertWorkspace } from "@shared/schema";

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

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { workspaces, setWorkspaces } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | undefined>();

  const { data: workspacesData } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
  });

  const { data: userSettings, isLoading: settingsLoading } = useQuery<UserSettings>({
    queryKey: [`/api/user-settings?userId=${user?.id}`],
    enabled: !!user?.id,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      return apiRequest("PATCH", "/api/user-settings", { ...data, userId: user?.id });
    },
    onSuccess: (data) => {
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

  if (settingsLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your LifeFlow experience
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how LifeFlow looks on your device
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
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => updateSettingsMutation.mutate({ theme: "light" })}
                data-testid="button-theme-light"
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => updateSettingsMutation.mutate({ theme: "dark" })}
                data-testid="button-theme-dark"
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => updateSettingsMutation.mutate({ theme: "system" })}
                data-testid="button-theme-system"
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
            <Switch
              checked={userSettings?.notificationsEnabled ?? true}
              onCheckedChange={(checked) => updateSettingsMutation.mutate({ notificationsEnabled: checked })}
              data-testid="switch-notifications"
            />
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Test Notifications</p>
              <p className="text-sm text-muted-foreground">
                Send a test notification to check if they are working
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (Notification.permission === 'granted') {
                  new Notification('Test Notification', {
                    body: 'This is how your notifications will look! 🍯',
                    icon: '/favicon.png'
                  });
                } else if (Notification.permission !== 'denied') {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      new Notification('Test Notification', {
                        body: 'This is how your notifications will look! 🍯',
                        icon: '/favicon.png'
                      });
                    }
                  });
                } else {
                  toast({ title: "Notifications blocked", description: "Please enable notifications in your browser settings", variant: "destructive" });
                }
              }}
            >
              Send Test
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
    </div>
  );
}
