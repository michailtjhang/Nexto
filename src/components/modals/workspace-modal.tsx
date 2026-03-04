"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { useWorkspaceModal } from "@/hooks/use-workspace-modal";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const WorkspaceModal = () => {
    const { isOpen, onClose } = useWorkspaceModal();
    const { workspaces, setWorkspaces, setActiveWorkspaceId } = useWorkspaceStore();
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        try {
            setIsLoading(true);
            const res = await fetch("/api/workspaces", {
                method: "POST",
                body: JSON.stringify({ name }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to create workspace");
            }

            const newWs = await res.json();
            setWorkspaces([...workspaces, newWs]);
            setActiveWorkspaceId(newWs.id);
            toast.success("Workspace created!");
            setName("");
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to create workspace.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-x-2">
                        <Plus className="h-5 w-5 text-indigo-600" />
                        Create Workspace
                    </DialogTitle>
                    <DialogDescription>
                        Give your new workspace a name to get started. You can invite your team later.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Workspace Name</Label>
                        <Input
                            id="name"
                            disabled={isLoading}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Acme Corp, Marketing, Design"
                            className="bg-secondary/50 border-primary/10 focus-visible:ring-indigo-600"
                        />
                    </div>
                </form>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        onClick={onSubmit}
                        disabled={isLoading || !name}
                        className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-none shadow-md shadow-indigo-500/20"
                    >
                        Create workspace
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
