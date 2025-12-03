import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Flame,
  Target,
  Check,
  MoreHorizontal,
  Edit,
  Trash2,
  Trophy,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, subDays, isSameDay, startOfDay } from "date-fns";
import type { Habit, HabitCompletion, InsertHabit } from "@shared/schema";

const colorOptions = [
  { value: "#10B981", label: "Green" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#F59E0B", label: "Orange" },
  { value: "#EF4444", label: "Red" },
  { value: "#EC4899", label: "Pink" },
];

const iconOptions = [
  { value: "target", label: "Target" },
  { value: "check", label: "Check" },
  { value: "flame", label: "Flame" },
  { value: "trophy", label: "Trophy" },
];

function HabitForm({
  habit,
  workspaceId,
  onClose,
}: {
  habit?: Habit;
  workspaceId: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(habit?.name || "");
  const [description, setDescription] = useState(habit?.description || "");
  const [color, setColor] = useState(habit?.color || "#10B981");
  const [icon, setIcon] = useState(habit?.icon || "target");
  const [frequency, setFrequency] = useState(habit?.frequency || "daily");
  const [targetCount, setTargetCount] = useState(habit?.targetCount?.toString() || "1");

  const createMutation = useMutation({
    mutationFn: async (data: InsertHabit) => {
      return apiRequest("POST", "/api/habits", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({ title: "Habit created successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to create habit", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Habit>) => {
      return apiRequest("PATCH", `/api/habits/${habit?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({ title: "Habit updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update habit", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      workspaceId,
      name,
      description: description || null,
      color,
      icon,
      frequency,
      targetCount: parseInt(targetCount) || 1,
    };

    if (habit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data as InsertHabit);
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
          placeholder="e.g., Morning Exercise"
          required
          data-testid="input-habit-name"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description..."
          rows={2}
          data-testid="input-habit-description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Frequency</label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger data-testid="select-habit-frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Target Count</label>
          <Input
            type="number"
            value={targetCount}
            onChange={(e) => setTargetCount(e.target.value)}
            min="1"
            data-testid="input-habit-target"
          />
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
              data-testid={`color-${option.label.toLowerCase()}`}
            />
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} data-testid="button-save-habit">
          {isPending ? "Saving..." : habit ? "Update Habit" : "Create Habit"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function HabitCard({
  habit,
  completions,
  onEdit,
  onDelete,
  onComplete,
}: {
  habit: Habit;
  completions: HabitCompletion[];
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onComplete: (habitId: string) => void;
}) {
  const today = startOfDay(new Date());
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  
  const isCompletedToday = completions.some(c => 
    isSameDay(new Date(c.date), today)
  );

  const completionDays = last7Days.map(day => ({
    date: day,
    completed: completions.some(c => isSameDay(new Date(c.date), day)),
  }));

  const monthlyCompletions = completions.filter(c => {
    const date = new Date(c.date);
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }).length;

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const monthlyProgress = (monthlyCompletions / daysInMonth) * 100;

  return (
    <Card className="group hover-elevate transition-all" data-testid={`habit-card-${habit.id}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: habit.color + "20" }}
            >
              <Target className="h-6 w-6" style={{ color: habit.color }} />
            </div>
            <div>
              <h3 className="font-semibold">{habit.name}</h3>
              {habit.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">{habit.description}</p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(habit)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(habit.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-2xl font-bold">{habit.currentStreak}</span>
            <span className="text-sm text-muted-foreground">day streak</span>
          </div>
          <Badge variant="outline" className="gap-1">
            <Trophy className="h-3 w-3" />
            Best: {habit.longestStreak}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2 mb-4">
          {completionDays.map(({ date, completed }) => (
            <div 
              key={date.toISOString()}
              className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                completed 
                  ? "text-white" 
                  : "bg-muted text-muted-foreground"
              }`}
              style={completed ? { backgroundColor: habit.color } : undefined}
            >
              {format(date, "d")}
            </div>
          ))}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monthly progress</span>
            <span className="font-medium">{monthlyCompletions}/{daysInMonth}</span>
          </div>
          <Progress value={monthlyProgress} className="h-2" />
        </div>

        <Button
          className="w-full"
          variant={isCompletedToday ? "secondary" : "default"}
          onClick={() => onComplete(habit.id)}
          disabled={isCompletedToday}
          data-testid={`button-complete-habit-${habit.id}`}
        >
          {isCompletedToday ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Completed Today
            </>
          ) : (
            <>
              <Target className="h-4 w-4 mr-2" />
              Mark Complete
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function OverallStats({ habits, completions }: { habits: Habit[]; completions: HabitCompletion[] }) {
  const today = startOfDay(new Date());
  const completedToday = habits.filter(h => 
    completions.some(c => c.habitId === h.id && isSameDay(new Date(c.date), today))
  ).length;

  const totalStreak = habits.reduce((acc, h) => acc + h.currentStreak, 0);
  const longestStreak = Math.max(...habits.map(h => h.longestStreak), 0);
  const activeHabits = habits.filter(h => !h.isArchived).length;

  const stats = [
    { label: "Today", value: `${completedToday}/${activeHabits}`, icon: Calendar, color: "text-blue-500" },
    { label: "Total Streak", value: totalStreak, icon: Flame, color: "text-orange-500" },
    { label: "Best Streak", value: longestStreak, icon: Trophy, color: "text-yellow-500" },
    { label: "Active Habits", value: activeHabits, icon: Target, color: "text-green-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1" data-testid={`stat-${stat.label.toLowerCase().replace(/ /g, "-")}`}>
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Habits() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();

  const { data: habits, isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits", currentWorkspace?.id],
    enabled: !!currentWorkspace,
  });

  const { data: completions } = useQuery<HabitCompletion[]>({
    queryKey: ["/api/habit-completions", currentWorkspace?.id],
    enabled: !!currentWorkspace,
  });

  const completeMutation = useMutation({
    mutationFn: async (habitId: string) => {
      return apiRequest("POST", "/api/habit-completions", {
        habitId,
        date: new Date(),
        count: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-completions"] });
      toast({ title: "Habit completed!" });
    },
    onError: () => {
      toast({ title: "Failed to complete habit", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/habits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({ title: "Habit deleted" });
    },
  });

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingHabit(undefined);
  };

  const activeHabits = habits?.filter(h => !h.isArchived) || [];
  const habitCompletions = completions || [];

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Select a workspace to view habits</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Habits</h1>
          <p className="text-muted-foreground mt-1">
            Build consistency and track your streaks
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingHabit(undefined)} data-testid="button-new-habit">
              <Plus className="h-4 w-4 mr-2" />
              New Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>{editingHabit ? "Edit Habit" : "Create New Habit"}</DialogTitle>
              <DialogDescription>
                {editingHabit ? "Update the habit details below" : "Add a new habit to track"}
              </DialogDescription>
            </DialogHeader>
            <HabitForm
              habit={editingHabit}
              workspaceId={currentWorkspace.id}
              onClose={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      <OverallStats habits={activeHabits} completions={habitCompletions} />

      {habitsLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-4" />
                <Skeleton className="h-8 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activeHabits.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No habits yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building good habits by creating your first one
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Habit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              completions={habitCompletions.filter(c => c.habitId === habit.id)}
              onEdit={handleEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
              onComplete={(id) => completeMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
