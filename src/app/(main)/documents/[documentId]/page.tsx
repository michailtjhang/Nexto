"use client";

import { useEffect, useMemo, useState, use } from "react";
import dynamic from "next/dynamic";
import { useDocumentStore } from "@/hooks/use-document-store";
import { Document, DatabaseColumn, DatabaseRow } from "@/lib/db/schema";
import { Toolbar } from "@/components/toolbar";
import { Cover } from "@/components/cover";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounceCallback } from "usehooks-ts";
import { File, Table2, SmilePlus, CheckSquare, Briefcase, Calendar, BookOpen, Home, PenTool } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";

interface DocumentIdPageProps {
    params: Promise<{
        documentId: string;
    }>;
}

const Editor = dynamic(() => import("@/components/editor/editor"), { ssr: false });
const DatabaseTable = dynamic(
    () => import("@/components/editor/database-table").then(m => ({ default: m.DatabaseTable })),
    { ssr: false }
);

const DocumentIdPage = ({
    params
}: DocumentIdPageProps) => {
    const { documentId } = use(params);
    const [document, setDocument] = useState<Document | null>(null);
    const [dbData, setDbData] = useState<{ id: string; columns: DatabaseColumn[]; rows: DatabaseRow[] } | null>(null);
    const [templateAppliedCount, setTemplateAppliedCount] = useState(0);

    const { setId, setTitle } = useDocumentStore();
    const { activeWorkspaceId, triggerRefresh } = useWorkspaceStore();

    useEffect(() => {
        const fetchDoc = async () => {
            const res = await fetch(`/api/documents/${documentId}`);
            if (!res.ok) return;
            const data = await res.json();
            setDocument(data);
            setId(data.id);
            setTitle(data.title);
        };

        fetchDoc();
    }, [documentId, setId, setTitle]);

    // Detect if this is a database document and fetch database data
    const isDatabasePage = useMemo(() => {
        if (!document?.content) return false;
        try {
            const parsed = typeof document.content === "string"
                ? JSON.parse(document.content)
                : document.content;
            return Array.isArray(parsed) && parsed.some((b: any) => b.type === "databaseBlock");
        } catch {
            return false;
        }
    }, [document?.content]);

    const databaseId = useMemo(() => {
        if (!document?.content) return null;
        try {
            const parsed = typeof document.content === "string"
                ? JSON.parse(document.content)
                : document.content;
            const dbBlock = Array.isArray(parsed) ? parsed.find((b: any) => b.type === "databaseBlock") : null;
            return dbBlock?.props?.databaseId ?? null;
        } catch {
            return null;
        }
    }, [document?.content]);

    useEffect(() => {
        if (!databaseId) return;

        const fetchDb = async () => {
            const res = await fetch(`/api/databases/${databaseId}`);
            if (!res.ok) return;
            const data = await res.json();
            setDbData({
                id: data.id,
                columns: (data.columns as DatabaseColumn[]) ?? [],
                rows: (data.rows as DatabaseRow[]) ?? [],
            });
        };

        fetchDb();
    }, [databaseId]);

    const isDocumentEmpty = useMemo(() => {
        if (!document?.content) return true;
        try {
            const parsed = typeof document.content === "string"
                ? JSON.parse(document.content)
                : document.content;
            if (!Array.isArray(parsed) || parsed.length === 0) return true;
            if (parsed.length === 1 && parsed[0].type === "paragraph" && (!parsed[0].content || parsed[0].content.length === 0)) {
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, [document?.content]);

    const onCreateEmptyDatabase = async () => {
        if (!activeWorkspaceId || !document) return;

        const promise = (async () => {
            const dbRes = await fetch("/api/databases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    documentId: document.id,
                    workspaceId: activeWorkspaceId,
                    title: document.title || "Untitled Database",
                }),
            });
            const db = await dbRes.json();

            const initialContent = JSON.stringify([
                {
                    id: crypto.randomUUID(),
                    type: "databaseBlock",
                    props: { databaseId: db.id },
                    children: [],
                },
            ]);

            const patchRes = await fetch(`/api/documents/${document.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: initialContent, emoji: "🗄️" }),
            });
            
            const updatedDoc = await patchRes.json();
            setDocument(updatedDoc);
            triggerRefresh();
        })();

        toast.promise(promise, {
            loading: "Creating database...",
            success: "Database created!",
            error: "Failed to create database.",
        });
    };

    const applyTemplate = async (templateName: string) => {
        if (!document) return;

        let initialContent: any[] = [];
        let emoji = "📄";
        let newTitle = document.title;

        if (templateName === "todo") {
            emoji = "✅";
            newTitle = "To-Do List";
            initialContent = [
                { type: "checkListItem", props: { isChecked: false }, content: "First task" },
                { type: "checkListItem", props: { isChecked: false }, content: "Second task" },
                { type: "checkListItem", props: { isChecked: false }, content: "Third task" },
            ];
        } else if (templateName === "project") {
            emoji = "🚀";
            newTitle = "Project Plan";
            initialContent = [
                { type: "heading", props: { level: 2 }, content: "Goals" },
                { type: "bulletListItem", content: "Goal 1" },
                { type: "bulletListItem", content: "Goal 2" },
                { type: "heading", props: { level: 2 }, content: "Timeline" },
                { type: "paragraph", content: "Write timeline here..." },
            ];
        } else if (templateName === "meeting") {
            emoji = "👥";
            newTitle = "Meeting Notes";
            initialContent = [
                { type: "paragraph", content: "Date: " },
                { type: "paragraph", content: "Attendees: " },
                { type: "heading", props: { level: 2 }, content: "Agenda" },
                { type: "bulletListItem", content: "Topic 1" },
                { type: "bulletListItem", content: "Topic 2" },
                { type: "heading", props: { level: 2 }, content: "Action Items" },
                { type: "checkListItem", props: { isChecked: false }, content: "Action 1" },
            ];
        } else if (templateName === "reading") {
            emoji = "📚";
            newTitle = "Reading List";
            initialContent = [
                { type: "paragraph", content: "Keep track of books, articles, and podcasts you want to consume." },
                { type: "heading", props: { level: 2 }, content: "To Read" },
                { type: "checkListItem", props: { isChecked: false }, content: "The Great Gatsby" },
                { type: "checkListItem", props: { isChecked: false }, content: "Atomic Habits" },
                { type: "heading", props: { level: 2 }, content: "Reading" },
                { type: "paragraph", content: "Currently reading..." },
            ];
        } else if (templateName === "journal") {
            emoji = "📓";
            newTitle = "Daily Journal";
            initialContent = [
                { type: "paragraph", content: `Date: ${new Date().toLocaleDateString()}` },
                { type: "heading", props: { level: 2 }, content: "How was your day?" },
                { type: "paragraph", content: "Write about your highlights, challenges, and thoughts today." },
                { type: "heading", props: { level: 2 }, content: "Gratitude" },
                { type: "bulletListItem", content: "I am grateful for..." },
            ];
        } else if (templateName === "personal") {
            emoji = "🏠";
            newTitle = "Personal Home";
            initialContent = [
                { type: "paragraph", content: "Your private space to organize your life." },
                { type: "heading", props: { level: 2 }, content: "Quick Links" },
                { type: "paragraph", content: "[Link to something]" },
                { type: "heading", props: { level: 2 }, content: "Goals for this year" },
                { type: "checkListItem", props: { isChecked: false }, content: "Learn something new" },
                { type: "checkListItem", props: { isChecked: false }, content: "Visit a new place" },
            ];
        }

        const promise = fetch(`/api/documents/${document.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle, content: JSON.stringify(initialContent), emoji }),
        }).then(res => res.json()).then(doc => {
            setDocument(doc);
            setTitle(doc.title);
            setTemplateAppliedCount(prev => prev + 1);
            triggerRefresh(); // Sync updates
        });

        toast.promise(promise, {
            loading: "Applying template...",
            success: "Template applied!",
            error: "Failed to apply template.",
        });
    };

    const debouncedUpdate = useDebounceCallback((content: string) => {
        fetch(`/api/documents/${documentId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content }),
        });
    }, 1000);

    const onChange = (content: string) => {
        debouncedUpdate(content);
    };

    if (document === null) {
        return (
            <div>
                <Cover.Skeleton />
                <div className="md:max-w-3xl lg:max-w-4xl mx-auto mt-10">
                    <div className="space-y-4 pl-8 pt-4">
                        <Skeleton className="h-14 w-[50%]" />
                        <Skeleton className="h-4 w-[80%]" />
                        <Skeleton className="h-4 w-[40%]" />
                        <Skeleton className="h-4 w-[60%]" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-40 min-h-full">
            <Cover url={document.coverImage || undefined} />
            <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
                <Toolbar initialData={document} />
                {isDatabasePage ? (
                    dbData ? (
                        <div className="px-4 sm:px-6">
                            <DatabaseTable
                                databaseId={dbData.id}
                                initialColumns={dbData.columns}
                                initialRows={dbData.rows}
                            />
                        </div>
                    ) : (
                        <div className="md:max-w-3xl lg:max-w-4xl mx-auto mt-10">
                            <div className="space-y-4 pl-8 pt-4">
                                <Skeleton className="h-14 w-[50%]" />
                                <Skeleton className="h-4 w-[80%]" />
                                <Skeleton className="h-4 w-[40%]" />
                                <Skeleton className="h-4 w-[60%]" />
                            </div>
                        </div>
                    )
                ) : (
                    <>
                        {isDocumentEmpty && (
                            <div className="pl-[54px] max-w-lg mt-2 flex flex-col gap-1 z-10 relative">
                                <button
                                    onClick={() => {
                                        fetch(`/api/documents/${document.id}`, {
                                            method: "PATCH",
                                            body: JSON.stringify({ emoji: "📄" }),
                                        }).then(res => res.json()).then(doc => setDocument(doc));
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm text-muted-foreground hover:bg-muted transition-colors text-left"
                                >
                                    <SmilePlus className="h-4 w-4 shrink-0" />
                                    <span className="font-medium">Empty page with icon</span>
                                </button>
                                <button
                                    onClick={() => {
                                        // Just setting focus to Editor implicitly handles Empty Page, but if they click it, we can ensure Editor focus 
                                        const editorEl = window.document.querySelector('.bn-editor');
                                        (editorEl as HTMLElement)?.focus();
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm text-muted-foreground hover:bg-muted transition-colors text-left"
                                >
                                    <File className="h-4 w-4 shrink-0" />
                                    <span className="font-medium">Empty page</span>
                                </button>
                                <div className="h-[1px] bg-border my-1 w-full scale-y-50"></div>
                                <button
                                    onClick={onCreateEmptyDatabase}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm text-muted-foreground hover:bg-muted transition-colors text-left"
                                >
                                    <Table2 className="h-4 w-4 shrink-0" />
                                    <span className="font-medium">Table</span>
                                </button>
                                
                                <div className="mt-4 mb-2 px-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recommended Templates</p>
                                </div>
                                <button
                                    onClick={() => applyTemplate("todo")}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm text-muted-foreground hover:bg-muted transition-colors text-left"
                                >
                                    <CheckSquare className="h-4 w-4 shrink-0" />
                                    <span className="font-medium">To-do list</span>
                                </button>
                                <button
                                    onClick={() => applyTemplate("project")}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm text-muted-foreground hover:bg-muted transition-colors text-left"
                                >
                                    <Briefcase className="h-4 w-4 shrink-0" />
                                    <span className="font-medium">Project plan</span>
                                </button>
                                <button
                                    onClick={() => applyTemplate("meeting")}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm text-muted-foreground hover:bg-muted transition-colors text-left"
                                >
                                    <Calendar className="h-4 w-4 shrink-0" />
                                    <span className="font-medium">Meeting notes</span>
                                </button>
                                <button
                                    onClick={() => applyTemplate("reading")}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm text-muted-foreground hover:bg-muted transition-colors text-left"
                                >
                                    <BookOpen className="h-4 w-4 shrink-0" />
                                    <span className="font-medium">Reading list</span>
                                </button>
                                <button
                                    onClick={() => applyTemplate("journal")}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm text-muted-foreground hover:bg-muted transition-colors text-left"
                                >
                                    <PenTool className="h-4 w-4 shrink-0" />
                                    <span className="font-medium">Journal</span>
                                </button>
                                <button
                                    onClick={() => applyTemplate("personal")}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm text-muted-foreground hover:bg-muted transition-colors text-left"
                                >
                                    <Home className="h-4 w-4 shrink-0" />
                                    <span className="font-medium">Personal home</span>
                                </button>
                            </div>
                        )}
                        <Editor
                            key={`${document.id}-${templateAppliedCount}`}
                            onChange={onChange}
                            initialContent={document.content as string}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default DocumentIdPage;
