import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/LoadingSkeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  FileText,
  Pin,
  PinOff,
  MoreHorizontal,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Note, InsertNote } from "@shared/schema";

const colorOptions = [
  { value: null, label: "Default" },
  { value: "#FEF3C7", label: "Yellow" },
  { value: "#DBEAFE", label: "Blue" },
  { value: "#D1FAE5", label: "Green" },
  { value: "#FCE7F3", label: "Pink" },
  { value: "#F3E8FF", label: "Purple" },
];

function NoteCard({
  note,
  isSelected,
  onClick,
  onPin,
  onDelete,
}: {
  note: Note;
  isSelected: boolean;
  onClick: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all hover-elevate group ${isSelected ? "ring-2 ring-primary" : ""
        }`}
      style={note.color ? { backgroundColor: note.color + "50" } : undefined}
      onClick={onClick}
      data-testid={`note-card-${note.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium line-clamp-1 flex-1">
            {note.title || "Untitled"}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {note.isPinned && (
              <Pin className="h-3.5 w-3.5 text-primary" />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(); }}>
                  {note.isPinned ? (
                    <>
                      <PinOff className="h-4 w-4 mr-2" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4 mr-2" />
                      Pin
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {note.content || "No content"}
        </p>
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {note.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NoteEditor({
  note,
  workspaceId,
  onClose,
  onSave,
}: {
  note: Note | null;
  workspaceId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [color, setColor] = useState(note?.color || null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setTitle(note?.title || "");
    setContent(note?.content || "");
    setColor(note?.color || null);
    setTags(note?.tags || []);
    setHasChanges(false);
  }, [note]);

  useEffect(() => {
    if (note) {
      const changed = title !== note.title ||
        content !== note.content ||
        color !== note.color ||
        JSON.stringify(tags) !== JSON.stringify(note.tags);
      setHasChanges(changed);
    } else {
      setHasChanges(title.length > 0 || content.length > 0);
    }
  }, [title, content, color, tags, note]);

  const saveMutation = useMutation({
    mutationFn: async (data: InsertNote | Partial<Note>) => {
      if (note) {
        return apiRequest("PATCH", `/api/notes/${note.id}`, data);
      } else {
        return apiRequest("POST", "/api/notes", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes?workspaceId=${workspaceId}`] });
      toast({ title: "Note saved" });
      onSave();
    },
    onError: () => {
      toast({ title: "Failed to save note", variant: "destructive" });
    },
  });

  const handleSave = () => {
    const data = {
      workspaceId,
      title: title || "Untitled",
      content,
      color,
      tags,
    };
    saveMutation.mutate(data);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b gap-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="text-lg font-medium border-0 p-0 h-auto focus-visible:ring-0"
          data-testid="input-note-title"
        />
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-muted-foreground">
              Unsaved
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || !hasChanges}
            data-testid="button-save-note"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          className="h-full resize-none border-0 rounded-none focus-visible:ring-0 text-base leading-relaxed p-4"
          data-testid="textarea-note-content"
        />
      </div>

      <div className="p-4 border-t space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Color:</span>
          <div className="flex gap-1">
            {colorOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                className={`w-6 h-6 rounded-full border-2 transition-all ${color === option.value
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground"
                  }`}
                style={{
                  backgroundColor: option.value || "transparent",
                  border: !option.value ? "2px dashed var(--border)" : undefined,
                }}
                onClick={() => setColor(option.value)}
                data-testid={`color-${option.label.toLowerCase()}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">Tags:</span>
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button onClick={() => handleRemoveTag(tag)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            placeholder="Add tag..."
            className="w-24 h-7 text-sm"
            data-testid="input-note-tag"
          />
        </div>
      </div>
    </div>
  );
}

export default function Notes() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: notes, isLoading } = useQuery<Note[]>({
    queryKey: [`/api/notes?workspaceId=${currentWorkspace?.id}`],
    enabled: !!currentWorkspace,
  });

  const pinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      return apiRequest("PATCH", `/api/notes/${id}`, { isPinned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes?workspaceId=${currentWorkspace?.id}`] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes?workspaceId=${currentWorkspace?.id}`] });
      toast({ title: "Note deleted" });
      if (selectedNote?.id === deleteMutation.variables) {
        setSelectedNote(null);
      }
    },
  });

  const filteredNotes = notes?.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pinnedNotes = filteredNotes?.filter(n => n.isPinned) || [];
  const otherNotes = filteredNotes?.filter(n => !n.isPinned) || [];

  const handleNewNote = () => {
    setSelectedNote(null);
    setIsCreating(true);
  };

  const handleCloseEditor = () => {
    setSelectedNote(null);
    setIsCreating(false);
  };

  const handleSaveNote = () => {
    setIsCreating(false);
  };

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Select a workspace to view notes</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)]">
      <div className="flex flex-col lg:flex-row h-full gap-6">
        <div className={`${selectedNote || isCreating ? "hidden lg:block lg:w-1/3" : "w-full"} space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
              <p className="text-muted-foreground mt-1">
                Quick notes and ideas
              </p>
            </div>
            <Button onClick={handleNewNote} data-testid="button-new-note">
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-10"
              data-testid="input-search-notes"
            />
          </div>

          <ScrollArea className="h-[calc(100vh-280px)]">
            {isLoading ? (
              <CardSkeleton count={4} className="grid-cols-1" />
            ) : filteredNotes?.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first note to get started
                  </p>
                  <Button onClick={handleNewNote}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pinnedNotes.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Pin className="h-3.5 w-3.5" />
                      Pinned
                    </h3>
                    <div className="grid gap-3">
                      {pinnedNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          isSelected={selectedNote?.id === note.id}
                          onClick={() => { setSelectedNote(note); setIsCreating(false); }}
                          onPin={() => pinMutation.mutate({ id: note.id, isPinned: !note.isPinned })}
                          onDelete={() => deleteMutation.mutate(note.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {otherNotes.length > 0 && (
                  <div className="space-y-2">
                    {pinnedNotes.length > 0 && (
                      <h3 className="text-sm font-medium text-muted-foreground">Others</h3>
                    )}
                    <div className="grid gap-3">
                      {otherNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          isSelected={selectedNote?.id === note.id}
                          onClick={() => { setSelectedNote(note); setIsCreating(false); }}
                          onPin={() => pinMutation.mutate({ id: note.id, isPinned: !note.isPinned })}
                          onDelete={() => deleteMutation.mutate(note.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {(selectedNote || isCreating) && (
          <Card className="flex-1 overflow-hidden">
            <NoteEditor
              note={selectedNote}
              workspaceId={currentWorkspace.id}
              onClose={handleCloseEditor}
              onSave={handleSaveNote}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
