import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/lib/theme-provider";
import { WorkspaceProvider, useWorkspace } from "@/lib/workspace-context";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase, GraduationCap, Dumbbell, Home, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Workspace, InsertWorkspace } from "@shared/schema";

import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import Calendar from "@/pages/calendar";
import TimeTracker from "@/pages/time-tracker";
import Habits from "@/pages/habits";
import Diary from "@/pages/diary";
import Notes from "@/pages/notes";
import Reports from "@/pages/reports";
import Projects from "@/pages/projects";
import Clients from "@/pages/clients";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

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

function WorkspaceModal({ 
  open, 
  onClose 
}: { 
  open: boolean; 
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [icon, setIcon] = useState("briefcase");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setIsCreating(true);
    try {
      await apiRequest("POST", "/api/workspaces", { name, color, icon });
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      toast({ title: "Workspace created successfully" });
      setName("");
      setColor("#3B82F6");
      setIcon("briefcase");
      onClose();
    } catch (error) {
      toast({ title: "Failed to create workspace", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize different areas of your life
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work, College, Fitness"
              data-testid="input-new-workspace-name"
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
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      icon === option.value 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    onClick={() => setIcon(option.value)}
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
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === option.value ? "ring-2 ring-offset-2 ring-primary" : ""
                  }`}
                  style={{ backgroundColor: option.value }}
                  onClick={() => setColor(option.value)}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={isCreating || !name.trim()}
            data-testid="button-create-workspace"
          >
            {isCreating ? "Creating..." : "Create Workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/time" component={TimeTracker} />
      <Route path="/habits" component={Habits} />
      <Route path="/diary" component={Diary} />
      <Route path="/notes" component={Notes} />
      <Route path="/reports" component={Reports} />
      <Route path="/projects" component={Projects} />
      <Route path="/clients" component={Clients} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { setWorkspaces, currentWorkspace } = useWorkspace();
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);

  const { data: workspaces } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
  });

  useEffect(() => {
    if (workspaces) {
      setWorkspaces(workspaces);
    }
  }, [workspaces, setWorkspaces]);

  const style = {
    "--sidebar-width": "280px",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar onAddWorkspace={() => setIsWorkspaceModalOpen(true)} />
        <SidebarInset className="flex flex-col flex-1">
          <header className="flex items-center justify-between px-4 py-3 border-b gap-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Router />
          </main>
        </SidebarInset>
      </div>
      <WorkspaceModal 
        open={isWorkspaceModalOpen} 
        onClose={() => setIsWorkspaceModalOpen(false)} 
      />
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <WorkspaceProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </WorkspaceProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
