import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWorkspace } from "@/lib/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { QuickTodo, InsertQuickTodo } from "@shared/schema";
import { X, Plus } from "lucide-react";
import { useState } from "react";

export function QuickTodos() {
    const { currentWorkspace } = useWorkspace();
    const { toast } = useToast();
    const [newTodo, setNewTodo] = useState("");

    const { data: todos } = useQuery<QuickTodo[]>({
        queryKey: [`/api/quick-todos?workspaceId=${currentWorkspace?.id}`],
        enabled: !!currentWorkspace,
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertQuickTodo) => {
            return apiRequest("POST", "/api/quick-todos", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/quick-todos?workspaceId=${currentWorkspace?.id}`] });
            setNewTodo("");
        },
    });

    const completeMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiRequest("DELETE", `/api/quick-todos/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/quick-todos?workspaceId=${currentWorkspace?.id}`] });
            toast({ title: "✅ Done!" });
        },
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim() || !currentWorkspace) return;

        createMutation.mutate({
            workspaceId: currentWorkspace.id,
            title: newTodo,
            completed: false,
        });
    };

    if (!currentWorkspace) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    ✅ Quick To-Dos
                    <span className="text-sm font-normal text-muted-foreground">
                        (Auto-delete when done)
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                    <Input
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        placeholder="Add a quick task..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!newTodo.trim()}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </form>

                <div className="space-y-2">
                    {todos?.map((todo) => (
                        <div
                            key={todo.id}
                            className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 group"
                        >
                            <span className="flex-1">{todo.title}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => completeMutation.mutate(todo.id)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {(!todos || todos.length === 0) && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No quick tasks. Add one above!
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
