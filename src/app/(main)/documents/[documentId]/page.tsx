"use client";

import { useEffect, useMemo, useState, use } from "react";
import dynamic from "next/dynamic";
import { useDocumentStore } from "@/hooks/use-document-store";
import { Document, DatabaseColumn, DatabaseRow } from "@/lib/db/schema";
import { Toolbar } from "@/components/toolbar";
import { Cover } from "@/components/cover";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounceCallback } from "usehooks-ts";

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

    const { setId, setTitle } = useDocumentStore();

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
                {isDatabasePage && dbData ? (
                    <div className="px-4 sm:px-6">
                        <DatabaseTable
                            databaseId={dbData.id}
                            initialColumns={dbData.columns}
                            initialRows={dbData.rows}
                        />
                    </div>
                ) : (
                    <Editor
                        onChange={onChange}
                        initialContent={document.content as string}
                    />
                )}
            </div>
        </div>
    );
};

export default DocumentIdPage;
