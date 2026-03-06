"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, File, Table2 } from "lucide-react";
import { toast } from "sonner";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Item } from "./item";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";

export const AddNewMenu = () => {
    const router = useRouter();
    const { activeWorkspaceId, triggerRefresh } = useWorkspaceStore();
    const [open, setOpen] = useState(false);

    const createEmptyPage = async () => {
        setOpen(false);
        if (!activeWorkspaceId) {
            toast.error("No active workspace found.");
            return;
        }

        const promise = fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: "Untitled",
                workspaceId: activeWorkspaceId,
            }),
        })
            .then(res => res.json())
            .then(doc => {
                triggerRefresh();
                router.push(`/documents/${doc.id}`);
            });

        toast.promise(promise, {
            loading: "Creating page...",
            success: "New page created!",
            error: "Failed to create page.",
        });
    };

    const createEmptyDatabase = async () => {
        setOpen(false);
        if (!activeWorkspaceId) {
            toast.error("No active workspace found.");
            return;
        }

        const promise = (async () => {
            // 1. Create the document first
            const docRes = await fetch("/api/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: "Untitled Database",
                    workspaceId: activeWorkspaceId,
                    emoji: "🗄️",
                }),
            });
            const doc = await docRes.json();

            // 2. Create a database entry linked to the document
            const dbRes = await fetch("/api/databases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    documentId: doc.id,
                    workspaceId: activeWorkspaceId,
                    title: "Untitled Database",
                }),
            });
            const db = await dbRes.json();

            // 3. Save a BlockNote content with the databaseBlock as the only block
            const initialContent = JSON.stringify([
                {
                    id: crypto.randomUUID(),
                    type: "databaseBlock",
                    props: { databaseId: db.id },
                    children: [],
                },
            ]);

            await fetch(`/api/documents/${doc.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: initialContent }),
            });

            triggerRefresh();
            router.push(`/documents/${doc.id}`);
        })();

        toast.promise(promise, {
            loading: "Creating database...",
            success: "Database created!",
            error: "Failed to create database.",
        });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className="w-full">
                <Item
                    label="Add New"
                    icon={PlusCircle}
                    onClick={() => setOpen(prev => !prev)}
                />
            </PopoverTrigger>
            <PopoverContent
                className="w-52 p-1.5"
                side="right"
                align="start"
                sideOffset={4}
            >
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    Create
                </p>
                <button
                    onClick={createEmptyPage}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors text-left"
                >
                    <File className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                        <p className="font-medium text-sm">Empty Page</p>
                        <p className="text-xs text-muted-foreground">Start with a blank page</p>
                    </div>
                </button>
                <button
                    onClick={createEmptyDatabase}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors text-left"
                >
                    <Table2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                        <p className="font-medium text-sm">Empty Database</p>
                        <p className="text-xs text-muted-foreground">Create a structured table</p>
                    </div>
                </button>
            </PopoverContent>
        </Popover>
    );
};
