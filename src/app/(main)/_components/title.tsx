"use client";

import { useRef, useState, useEffect } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Document } from "@/lib/db/schema";
import { useDocumentStore } from "@/hooks/use-document-store";

interface TitleProps {
    initialData: Document;
}

export const Title = ({
    initialData
}: TitleProps) => {
    const { title, setTitle } = useDocumentStore();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);

    const enableInput = () => {
        setIsEditing(true);
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 0);
    };

    const disableInput = () => {
        setIsEditing(false);
    };

    const debouncedUpdate = useDebounceCallback((value: string) => {
        fetch(`/api/documents/${initialData.id}`, {
            method: "PATCH",
            body: JSON.stringify({ title: value.trim() || "Untitled" }),
        });
    }, 500);

    const onChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setTitle(event.target.value);
        debouncedUpdate(event.target.value);
    };

    const onKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (event.key === "Enter") {
            disableInput();
        }
    };

    return (
        <div className="flex items-center gap-x-1">
            {!!initialData.emoji && <p>{initialData.emoji}</p>}
            {isEditing ? (
                <Input
                    ref={inputRef}
                    onBlur={disableInput}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    value={title}
                    className="h-7 px-2 focus-visible:ring-transparent"
                />
            ) : (
                <Button
                    onClick={enableInput}
                    variant="ghost"
                    size="sm"
                    className="font-normal h-auto p-1"
                >
                    <span className="truncate">
                        {title || "Untitled"}
                    </span>
                </Button>
            )}
        </div>
    );
};

Title.Skeleton = function TitleSkeleton() {
    return (
        <Skeleton className="h-6 w-20 rounded-md" />
    );
};
