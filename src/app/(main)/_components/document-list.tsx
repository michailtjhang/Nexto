"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Item } from "./item";
import { Document } from "@/lib/db/schema";

interface DocumentListProps {
    parentDocumentId?: string;
    level?: number;
    data?: Document[];
}

export const DocumentList = ({
    parentDocumentId,
    level = 0
}: DocumentListProps) => {
    const params = useParams();
    const router = useRouter();
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [documents, setDocuments] = useState<Document[] | undefined>(undefined);

    const onExpand = (documentId: string) => {
        setExpanded(prevExpanded => ({
            ...prevExpanded,
            [documentId]: !prevExpanded[documentId]
        }));
    };

    useEffect(() => {
        const fetchDocuments = async () => {
            // For now, using a simple fetch. In a real app, you might use TanStack Query or SWR.
            // But we'll try to keep it simple with fetch for now.
            const url = parentDocumentId
                ? `/api/documents?parentId=${parentDocumentId}`
                : `/api/documents`;

            const res = await fetch(url);
            if (!res.ok) {
                setDocuments([]);
                return;
            }
            const data = await res.json();
            setDocuments(data);
        };

        fetchDocuments();
    }, [parentDocumentId, params?.documentId]); // Re-fetch when current doc changes (might have new children/archived)

    const onRedirect = (documentId: string) => {
        router.push(`/documents/${documentId}`);
    };

    if (documents === undefined) {
        return (
            <>
                <Item.Skeleton level={level} />
                {level === 0 && (
                    <>
                        <Item.Skeleton level={level} />
                        <Item.Skeleton level={level} />
                    </>
                )}
            </>
        );
    }

    return (
        <>
            <p
                style={{
                    paddingLeft: level ? `${level * 12 + 25}px` : undefined
                }}
                className={cn(
                    "hidden text-sm font-medium text-muted-foreground/80",
                    expanded && "last:block",
                    level === 0 && "hidden"
                )}
            >
                No pages inside
            </p>
            {documents.map((document) => (
                <div key={document.id}>
                    <Item
                        id={document.id}
                        onClick={() => onRedirect(document.id)}
                        label={document.title}
                        icon={FileIcon}
                        documentIcon={document.emoji || undefined}
                        active={params?.documentId === document.id}
                        level={level}
                        onExpand={() => onExpand(document.id)}
                        expanded={expanded[document.id]}
                    />
                    {expanded[document.id] && (
                        <DocumentList
                            parentDocumentId={document.id}
                            level={level + 1}
                        />
                    )}
                </div>
            ))}
        </>
    );
};
