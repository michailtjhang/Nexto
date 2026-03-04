"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { cn } from "@/lib/utils";

export const WorkspaceSwitcher = () => {
    const { user } = useUser();
    const { activeWorkspaceId, setActiveWorkspaceId } = useWorkspaceStore();
    const [workspaces, setWorkspaces] = useState<any[]>([]);
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
    }, []);

    const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);

    const onSelect = (id: string) => {
        setActiveWorkspaceId(id);
        setOpen(false);
    };

    const onCreateWorkspace = async () => {
        const name = window.prompt("Enter workspace name:");
        if (!name) return;

        const res = await fetch("/api/workspaces", {
            method: "POST",
            body: JSON.stringify({ name }),
        });

        if (res.ok) {
            const newWs = await res.json();
            setWorkspaces((prev) => [...prev, newWs]);
            setActiveWorkspaceId(newWs.id);
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
                            onClick={() => onSelect(workspace.id)}
                            className={cn(
                                "flex items-center gap-x-2 p-2 hover:bg-primary/5 cursor-pointer transition text-sm",
                                activeWorkspaceId === workspace.id && "bg-primary/5"
                            )}
                        >
                            <div className="rounded-md bg-secondary p-1 h-6 w-6 flex items-center justify-center font-bold text-xs text-muted-foreground">
                                {workspace.name.charAt(0)}
                            </div>
                            <span className="flex-1 truncate">{workspace.name}</span>
                            {activeWorkspaceId === workspace.id && (
                                <Check className="h-4 w-4" />
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
