"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, Trash, Undo } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Document } from "@/lib/db/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { Button } from "@/components/ui/button";

export const TrashBox = () => {
    const router = useRouter();
    const params = useParams();
    const [search, setSearch] = useState("");
    const [documents, setDocuments] = useState<Document[] | undefined>(undefined);

    const { activeWorkspaceId, triggerRefresh } = useWorkspaceStore();

    const fetchDocuments = async () => {
        if (!activeWorkspaceId) return;
        const res = await fetch(`/api/documents?archived=true&workspaceId=${activeWorkspaceId}`);
        if (!res.ok) {
            setDocuments([]);
            return;
        }
        const data = await res.json();
        setDocuments(data);
    };

    useEffect(() => {
        fetchDocuments();
    }, [activeWorkspaceId]);

    const onRestore = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>,
        documentId: string
    ) => {
        event.stopPropagation();
        const promise = fetch(`/api/documents/${documentId}/restore`, {
            method: "PATCH",
        }).then(() => fetchDocuments());

        toast.promise(promise, {
            loading: "Restoring note...",
            success: "Note restored!",
            error: "Failed to restore note.",
        });
    };

    const onRemove = (id: string | undefined) => {
        if (!id) return;
        const promise = fetch(`/api/documents/${id}`, {
            method: "DELETE",
        }).then(() => {
            fetchDocuments();
            triggerRefresh(); // Sync sidebar
        });

        toast.promise(promise, {
            loading: "Deleting note...",
            success: "Note deleted!",
            error: "Failed to delete note.",
        });

        if (params?.documentId === id) {
            router.push("/documents");
        }
    };

    const onEmptyTrash = () => {
        if (!activeWorkspaceId) return;

        const promise = fetch("/api/documents/trash/empty", {
            method: "POST",
            body: JSON.stringify({ workspaceId: activeWorkspaceId })
        }).then(() => {
            fetchDocuments();
            triggerRefresh();
        });

        toast.promise(promise, {
            loading: "Emptying trash...",
            success: "Trash emptied!",
            error: "Failed to empty trash.",
        });
    };

    const filteredDocuments = documents?.filter((doc) => {
        return doc.title.toLowerCase().includes(search.toLowerCase());
    });

    if (documents === undefined) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return (
        <div className="text-sm">
            <div className="flex items-center gap-x-1 p-2">
                <Search className="h-4 w-4" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-7 px-2 focus-visible:ring-transparent bg-secondary"
                    placeholder="Filter by page title..."
                />
            </div>
            {filteredDocuments && filteredDocuments.length > 0 && (
                <div className="px-2 pb-2">
                    <ConfirmModal onConfirm={onEmptyTrash}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs text-muted-foreground hover:text-destructive"
                        >
                            <Trash className="h-3 w-3 mr-2" />
                            Empty Trash
                        </Button>
                    </ConfirmModal>
                </div>
            )}
            <div className="mt-2 px-1 pb-1">
                <p className="hidden last:block text-xs text-center text-muted-foreground pb-2">
                    No documents found.
                </p>
                {filteredDocuments?.map((document) => (
                    <div
                        key={document.id}
                        role="button"
                        onClick={() => router.push(`/documents/${document.id}`)}
                        className="text-sm rounded-sm w-full hover:bg-primary/5 flex items-center text-primary justify-between"
                    >
                        <span className="truncate pl-2">{document.title}</span>
                        <div className="flex items-center">
                            <div
                                onClick={(e) => onRestore(e, document.id)}
                                role="button"
                                className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                            >
                                <Undo className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <ConfirmModal onConfirm={() => onRemove(document.id)}>
                                <div
                                    role="button"
                                    className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                                >
                                    <Trash className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </ConfirmModal>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
