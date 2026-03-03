"use client";

import { useEffect, useState } from "react";
import { File } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useSearch } from "@/hooks/use-search";
import { Document } from "@/lib/db/schema";

export const SearchCommand = () => {
    const { user } = useUser();
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const toggle = useSearch((store) => store.toggle);
    const isOpen = useSearch((store) => store.isOpen);
    const onClose = useSearch((store) => store.onClose);

    useEffect(() => {
        const fetchDocs = async () => {
            const res = await fetch("/api/documents");
            if (!res.ok) {
                setDocuments([]);
                return;
            }
            const data = await res.json();
            setDocuments(data);
        };
        fetchDocs();
    }, [isOpen]);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                toggle();
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [toggle]);

    const onSelect = (id: string) => {
        router.push(`/documents/${id}`);
        onClose();
    };

    if (!user) {
        return null;
    }

    return (
        <CommandDialog open={isOpen} onOpenChange={onClose}>
            <CommandInput placeholder={`Search ${user?.fullName}'s Nexto...`} />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Documents">
                    {documents?.map((document) => (
                        <CommandItem
                            key={document.id}
                            value={`${document.id}-${document.title}`}
                            title={document.title}
                            onSelect={() => onSelect(document.id)}
                        >
                            {document.emoji ? (
                                <p className="mr-2 text-[18px]">{document.emoji}</p>
                            ) : (
                                <File className="mr-2 h-4 w-4" />
                            )}
                            <span>{document.title}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
};
