import { Check, ChevronsUpDown, Plus, Briefcase, GraduationCap, Dumbbell, Home, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import type { Workspace } from "@shared/schema";

const iconMap: Record<string, typeof Briefcase> = {
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  dumbbell: Dumbbell,
  home: Home,
  star: Star,
};

interface WorkspaceSwitcherProps {
  onAddWorkspace?: () => void;
}

export function WorkspaceSwitcher({ onAddWorkspace }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const { currentWorkspace, setCurrentWorkspace, workspaces } = useWorkspace();

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Briefcase;
    return Icon;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between px-3 py-6 hover-elevate"
          data-testid="button-workspace-switcher"
        >
          <div className="flex items-center gap-3">
            {currentWorkspace && (
              <>
                <div 
                  className="w-8 h-8 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: currentWorkspace.color + "20" }}
                >
                  {(() => {
                    const Icon = getIcon(currentWorkspace.icon);
                    return <Icon className="h-4 w-4" style={{ color: currentWorkspace.color }} />;
                  })()}
                </div>
                <span className="font-medium truncate">{currentWorkspace.name}</span>
              </>
            )}
            {!currentWorkspace && (
              <span className="text-muted-foreground">Select workspace</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search workspaces..." data-testid="input-workspace-search" />
          <CommandList>
            <CommandEmpty>No workspace found.</CommandEmpty>
            <CommandGroup heading="Workspaces">
              {workspaces.map((workspace) => {
                const Icon = getIcon(workspace.icon);
                return (
                  <CommandItem
                    key={workspace.id}
                    value={workspace.name}
                    onSelect={() => {
                      setCurrentWorkspace(workspace);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                    data-testid={`workspace-item-${workspace.id}`}
                  >
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center mr-2"
                      style={{ backgroundColor: workspace.color + "20" }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: workspace.color }} />
                    </div>
                    <span className="flex-1">{workspace.name}</span>
                    {currentWorkspace?.id === workspace.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  onAddWorkspace?.();
                }}
                className="cursor-pointer"
                data-testid="button-add-workspace"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Add Workspace</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
