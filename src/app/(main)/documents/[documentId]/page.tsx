"use client";

import { useEffect, useMemo, useState, use } from "react";
import dynamic from "next/dynamic";
import { Document } from "@/lib/db/schema";
import { Toolbar } from "@/components/toolbar";
import { Cover } from "@/components/cover";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentIdPageProps {
    params: Promise<{
        documentId: string;
    }>;
}

const DocumentIdPage = ({
    params
}: DocumentIdPageProps) => {
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

    const onChange = (content: string) => {
        fetch(`/api/documents/${documentId}`, {
            method: "PATCH",
            body: JSON.stringify({ content }),
        });
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
        <div className="pb-40">
            <Cover url={document.coverImage || undefined} />
            <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
                <Toolbar initialData={document} />
                <Editor
                    onChange={onChange}
                    initialContent={document.content as string}
                />
            </div>
        </div>
    );
};

export default DocumentIdPage;
