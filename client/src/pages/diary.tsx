import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  BookOpen,
  Calendar,
  Smile,
  Meh,
  Frown,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, addDays, subDays, isSameDay, startOfDay } from "date-fns";
import type { DiaryEntry, InsertDiaryEntry } from "@shared/schema";

const moodOptions = [
  { value: "great", label: "Great", icon: Sparkles, color: "text-green-500" },
  { value: "good", label: "Good", icon: ThumbsUp, color: "text-blue-500" },
  { value: "okay", label: "Okay", icon: Meh, color: "text-yellow-500" },
  { value: "bad", label: "Bad", icon: ThumbsDown, color: "text-orange-500" },
  { value: "terrible", label: "Terrible", icon: Frown, color: "text-red-500" },
];

function MoodSelector({
  value,
  onChange
}: {
  value: string | null;
  onChange: (mood: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {moodOptions.map((mood) => (
        <Button
          key={mood.value}
          type="button"
          variant={value === mood.value ? "secondary" : "ghost"}
          size="sm"
          className={`gap-1.5 ${value === mood.value ? mood.color : ""}`}
          onClick={() => onChange(mood.value)}
          data-testid={`mood-${mood.value}`}
        >
          <mood.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{mood.label}</span>
        </Button>
      ))}
    </div>
  );
}

function DiaryEditor({
  date,
  entry,
  workspaceId,
}: {
  date: Date;
  entry: DiaryEntry | undefined;
  workspaceId: string | null;
}) {
  const { toast } = useToast();
  const [content, setContent] = useState(entry?.content || "");
  const [mood, setMood] = useState(entry?.mood || null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setContent(entry?.content || "");
    setMood(entry?.mood || null);
    setHasChanges(false);
  }, [entry, date]);

  useEffect(() => {
    if (entry) {
      setHasChanges(content !== entry.content || mood !== entry.mood);
    } else {
      setHasChanges(content.length > 0 || mood !== null);
    }
  }, [content, mood, entry]);

  const saveMutation = useMutation({
    mutationFn: async (data: InsertDiaryEntry | Partial<DiaryEntry>) => {
      if (entry) {
        return apiRequest("PATCH", `/api/diary-entries/${entry.id}`, data);
      } else {
        return apiRequest("POST", "/api/diary-entries", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/diary-entries?workspaceId=${workspaceId}`] });
      toast({ title: "Entry saved" });
      setHasChanges(false);
    },
    onError: () => {
      toast({ title: "Failed to save entry", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!workspaceId) return;

    const data = {
      workspaceId,
      date: startOfDay(date),
      content,
      mood,
    };

    saveMutation.mutate(data);
  };

  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (hasChanges && content.length > 0 && workspaceId) {
        handleSave();
      }
    }, 3000);

    return () => clearTimeout(autoSave);
  }, [content, mood, hasChanges]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <MoodSelector value={mood} onChange={setMood} />
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-muted-foreground">
              Unsaved changes
            </Badge>
          )}
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || !hasChanges}
            data-testid="button-save-diary"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write about your day..."
        className="min-h-[400px] resize-none text-base leading-relaxed"
        data-testid="textarea-diary-content"
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{content.length} characters</span>
        <span>{content.split(/\s+/).filter(Boolean).length} words</span>
      </div>
    </div>
  );
}

function DiaryHistory({
  entries,
  currentDate,
  onSelectDate,
}: {
  entries: DiaryEntry[];
  currentDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  const recentEntries = entries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const getMoodIcon = (mood: string | null) => {
    const option = moodOptions.find(m => m.value === mood);
    return option?.icon || Meh;
  };

  const getMoodColor = (mood: string | null) => {
    const option = moodOptions.find(m => m.value === mood);
    return option?.color || "text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Entries</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recentEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No entries yet</p>
          </div>
        ) : (
          recentEntries.map((entry) => {
            const MoodIcon = getMoodIcon(entry.mood);
            const isSelected = isSameDay(new Date(entry.date), currentDate);

            return (
              <button
                key={entry.id}
                onClick={() => onSelectDate(new Date(entry.date))}
                className={`w-full text-left p-3 rounded-lg transition-all hover-elevate ${isSelected ? "bg-primary/10" : "bg-muted/30"
                  }`}
                data-testid={`diary-entry-${entry.id}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">
                    {format(new Date(entry.date), "MMM d, yyyy")}
                  </span>
                  <MoodIcon className={`h-4 w-4 ${getMoodColor(entry.mood)}`} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {entry.content.substring(0, 100)}...
                </p>
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function DiaryStats({ entries }: { entries: DiaryEntry[] }) {
  const thisMonth = entries.filter(e => {
    const date = new Date(e.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const moodCounts = thisMonth.reduce((acc, entry) => {
    if (entry.mood) {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const totalWords = entries.reduce((acc, e) =>
    acc + e.content.split(/\s+/).filter(Boolean).length, 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">This Month</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Entries</span>
          <span className="font-bold">{thisMonth.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Words</span>
          <span className="font-bold">{totalWords.toLocaleString()}</span>
        </div>
        <div className="pt-2 border-t">
          <p className="text-sm font-medium mb-2">Mood Summary</p>
          <div className="space-y-1.5">
            {moodOptions.map((mood) => {
              const count = moodCounts[mood.value] || 0;
              const percentage = thisMonth.length > 0 ? (count / thisMonth.length) * 100 : 0;

              return (
                <div key={mood.value} className="flex items-center gap-2">
                  <mood.icon className={`h-4 w-4 ${mood.color}`} />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: mood.color.replace("text-", "").includes("-500")
                          ? `var(--${mood.color.replace("text-", "").replace("-500", "")})`
                          : undefined,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-6">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Diary() {
  const { currentWorkspace } = useWorkspace();
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));

  const { data: entries, isLoading } = useQuery<DiaryEntry[]>({
    queryKey: [`/api/diary-entries?workspaceId=${currentWorkspace?.id}`],
    enabled: !!currentWorkspace,
  });

  const currentEntry = entries?.find(e =>
    isSameDay(new Date(e.date), currentDate)
  );

  const handlePreviousDay = () => setCurrentDate(subDays(currentDate, 1));
  const handleNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const handleToday = () => setCurrentDate(startOfDay(new Date()));

  const isToday = isSameDay(currentDate, new Date());

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Select a workspace to write in your diary</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Diary</h1>
          <p className="text-muted-foreground mt-1">
            Reflect on your day and track your journey
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePreviousDay}
                    data-testid="button-prev-day"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-center min-w-[200px]">
                    <h2 className="text-xl font-semibold" data-testid="text-current-date">
                      {format(currentDate, "EEEE")}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {format(currentDate, "MMMM d, yyyy")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextDay}
                    disabled={isToday}
                    data-testid="button-next-day"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                {!isToday && (
                  <Button variant="ghost" size="sm" onClick={handleToday}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Today
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ListSkeleton count={1} className="h-[400px]" />
              ) : (
                <DiaryEditor
                  date={currentDate}
                  entry={currentEntry}
                  workspaceId={currentWorkspace?.id || null}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <DiaryStats entries={entries || []} />
          <DiaryHistory
            entries={entries || []}
            currentDate={currentDate}
            onSelectDate={setCurrentDate}
          />
        </div>
      </div>
    </div>
  );
}
