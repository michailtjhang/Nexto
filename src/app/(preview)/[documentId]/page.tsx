"use client";

import { useEffect, useMemo, useState, use } from "react";
import dynamic from "next/dynamic";
import { Document } from "@/lib/db/schema";
import { Toolbar } from "@/components/toolbar";
import { Cover } from "@/components/cover";
import { Skeleton } from "@/components/ui/skeleton";

interface PreviewPageProps {
    params: Promise<{
        documentId: string;
    }>;
}

const PreviewPage = ({
    params
}: PreviewPageProps) => {
    const { documentId } = use(params);
    const Editor = useMemo(() => dynamic(() => import("@/components/editor/editor"), { ssr: false }), []);
    const [document, setDocument] = useState<Document | null>(null);

    useEffect(() => {
        const fetchDoc = async () => {
            const res = await fetch(`/api/documents/${documentId}`);
            if (!res.ok) return;
            const data = await res.json();
            setDocument(data);
        };

        fetchDoc();
    }, [documentId]);

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

    // If page is not published, it shouldn't be visible via preview
    if (!document.isPublished) {
        return (
            <div className="h-full flex items-center justify-center">
                Note not published.
            </div>
        );
    }

    return (
        <div className="pb-40">
            <Cover preview url={document.coverImage || undefined} />
            <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
                <Toolbar preview initialData={document} />
                {isDatabasePage ? (
                    <div className="p-8 text-center text-muted-foreground">
                        Database view is not supported in preview mode.
                    </div>
                ) : (
                    <Editor
                        editable={false}
                        onChange={() => { }}
                        initialContent={document.content as string}
                    />
                )}
            </div>
        </div>
    );
};

export default PreviewPage;
