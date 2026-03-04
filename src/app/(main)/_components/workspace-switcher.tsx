"use client";

import { Check, ChevronsUpDown, MoreVertical, Plus, Trash, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { useWorkspaceModal } from "@/hooks/use-workspace-modal";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const WorkspaceSwitcher = () => {
    const { user } = useUser();
    const { activeWorkspaceId, setActiveWorkspaceId, workspaces, setWorkspaces } = useWorkspaceStore();
    const { onOpen: onOpenWorkspaceModal } = useWorkspaceModal();
    const settings = useSettings();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const fetchWorkspaces = async () => {
            const res = await fetch("/api/workspaces");
            if (res.ok) {
                const data = await res.json();
                setWorkspaces(data);
            }
        };
        fetchWorkspaces();
    }, [setWorkspaces]);

    const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);

    const onSelect = (id: string) => {
        setActiveWorkspaceId(id);
        setOpen(false);
    };

    const onCreateWorkspace = () => {
        setOpen(false);
        onOpenWorkspaceModal();
    };

    const onDeleteWorkspace = async (id: string) => {
        const confirm = window.confirm("Are you sure you want to delete this workspace? All documents will be lost.");
        if (!confirm) return;

        try {
            const res = await fetch(`/api/workspaces/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete workspace");

            toast.success("Workspace deleted");
            const filteredWorkspaces = workspaces.filter(ws => ws.id !== id);
            setWorkspaces(filteredWorkspaces);

            if (filteredWorkspaces.length > 0) {
                setActiveWorkspaceId(filteredWorkspaces[0].id);
            } else {
                setActiveWorkspaceId(null);
            }
        } catch (error) {
            toast.error("Failed to delete workspace");
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between hover:bg-primary/5 transition"
                >
                    <div className="flex items-center gap-x-2">
                        <div className="rounded-md bg-secondary p-1 h-6 w-6 flex items-center justify-center font-bold text-xs">
                            {activeWorkspace?.name?.charAt(0) || "W"}
                        </div>
                        <span className="text-sm font-medium truncate max-w-[120px]">
                            {activeWorkspace?.name || "Select Workspace"}
                        </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
                <div className="flex flex-col">
                    <div className="p-2 text-xs font-medium text-muted-foreground">
                        {user?.emailAddresses[0].emailAddress}
                    </div>
                    {workspaces.map((workspace) => (
                        <div
                            key={workspace.id}
                            className="flex items-center gap-x-2 w-full"
                        >
                            <div
                                role="button"
                                onClick={() => onSelect(workspace.id)}
                                className={cn(
                                    "flex items-center gap-x-2 w-full p-2 rounded-md hover:bg-neutral-100 transition truncate",
                                    activeWorkspaceId === workspace.id && "bg-neutral-100"
                                )}
                            >
                                <div className="h-6 w-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                    {workspace.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm truncate">
                                    {workspace.name}
                                </span>
                                {activeWorkspaceId === workspace.id && (
                                    <Check className="h-4 w-4 ml-auto text-indigo-600" />
                                )}
                            </div>
                            {activeWorkspaceId === workspace.id && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 shrink-0"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={settings.onOpen}>
                                            <Settings className="h-4 w-4 mr-2" />
                                            Settings
                                        </DropdownMenuItem>
                                        {workspace.userId === user?.id && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => onDeleteWorkspace(workspace.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    ))}
                    <div className="border-t mt-1 p-1">
                        <Button
                            onClick={onCreateWorkspace}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs font-normal"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create workspace
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
