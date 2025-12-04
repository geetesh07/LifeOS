import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { TaskStatus, InsertTaskStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";

interface StatusManagerProps {
    workspaceId: string;
}

export function StatusManager({ workspaceId }: StatusManagerProps) {
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingStatus, setEditingStatus] = useState<TaskStatus | null>(null);
    const [name, setName] = useState("");
    const [color, setColor] = useState("#3B82F6");

    const { data: statuses } = useQuery<TaskStatus[]>({
        queryKey: [`/api/task-statuses?workspaceId=${workspaceId}`],
        enabled: !!workspaceId,
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertTaskStatus) => {
            return apiRequest("POST", "/api/task-statuses", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/task-statuses?workspaceId=${workspaceId}`] });
            toast({ title: "Status created" });
            handleCloseDialog();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<TaskStatus> }) => {
            return apiRequest("PATCH", `/api/task-statuses/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/task-statuses?workspaceId=${workspaceId}`] });
            toast({ title: "Status updated" });
            handleCloseDialog();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiRequest("DELETE", `/api/task-statuses/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/task-statuses?workspaceId=${workspaceId}`] });
            toast({ title: "Status deleted" });
        },
    });

    const handleOpenDialog = (status?: TaskStatus) => {
        if (status) {
            setEditingStatus(status);
            setName(status.name);
            setColor(status.color);
        } else {
            setEditingStatus(null);
            setName("");
            setColor("#3B82F6");
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingStatus(null);
        setName("");
        setColor("#3B82F6");
    };

    const handleSubmit = () => {
        if (!name.trim()) return;

        if (editingStatus) {
            updateMutation.mutate({
                id: editingStatus.id,
                data: { name, color },
            });
        } else {
            const maxOrder = Math.max(...(statuses?.map(s => s.order) || [0]), -1);
            createMutation.mutate({
                workspaceId,
                name,
                color,
                order: maxOrder + 1,
                isDefault: false,
                isDoneState: false,
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Task Statuses</h3>
                <Button onClick={() => handleOpenDialog()} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Status
                </Button>
            </div>

            <div className="space-y-2">
                {statuses?.map((status) => (
                    <div
                        key={status.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                        />
                        <span className="flex-1 font-medium">{status.name}</span>
                        {status.isDefault && (
                            <span className="text-xs text-muted-foreground">(Default)</span>
                        )}
                        {status.isDoneState && (
                            <span className="text-xs text-muted-foreground">(Done)</span>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(status)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(status.id)}
                            disabled={status.isDefault || status.isDoneState}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingStatus ? "Edit Status" : "Create Status"}</DialogTitle>
                        <DialogDescription>
                            {editingStatus ? "Update the status details" : "Add a new status to your workflow"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., In Review"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Color</label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-20 h-10"
                                />
                                <Input
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    placeholder="#3B82F6"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {editingStatus ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
