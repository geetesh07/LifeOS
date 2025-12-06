import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Clock,
  Target,
  BookOpen,
  FileText,
  BarChart3,
  Settings,
  Users,
  Folder,
  IndianRupee,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { useWorkspace } from "@/lib/workspace-context";
import { useAuth } from "@/lib/auth-context";
import { LogOut } from "lucide-react";
import { Button } from "./ui/button";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Time Tracker",
    url: "/time",
    icon: Clock,
  },
];

const lifeItems = [
  {
    title: "Habits",
    url: "/habits",
    icon: Target,
  },
  {
    title: "Diary",
    url: "/diary",
    icon: BookOpen,
  },
  {
    title: "Notes",
    url: "/notes",
    icon: FileText,
  },
];

const manageItems = [
  {
    title: "Projects",
    url: "/projects",
    icon: Folder,
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
  },
  {
    title: "Finances",
    url: "/finances",
    icon: IndianRupee,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
];

function LogoutButton() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  if (!user) return null;

  return (
    <div className="px-2 py-2">
      <div className="flex items-center justify-between px-2 py-2 rounded-md bg-sidebar-accent/50">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface AppSidebarProps {
  onAddWorkspace?: () => void;
}

export function AppSidebar({ onAddWorkspace }: AppSidebarProps) {
  const [location] = useLocation();
  const { currentWorkspace } = useWorkspace();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="px-2 py-3">
          <div className="flex items-center gap-2 px-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">LO</span>
            </div>
            <span className="font-semibold text-lg">LifeOS</span>
          </div>
          <WorkspaceSwitcher onAddWorkspace={onAddWorkspace} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Life</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {lifeItems
                // Hide Diary for non-Life workspaces
                .filter((item) => item.title !== "Diary" || currentWorkspace?.name === "Life")
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      tooltip={item.title}
                    >
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {manageItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location === "/profile"}
              tooltip="My Profile"
            >
              <Link href="/profile" data-testid="nav-profile">
                <Users className="h-4 w-4" />
                <span>My Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location === "/settings"}
              tooltip="Settings"
            >
              <Link href="/settings" data-testid="nav-settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  );
}
