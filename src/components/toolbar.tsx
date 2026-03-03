"use client";

import { useEffect, useRef, ElementRef, useState } from "react";
import { ImageIcon, Smile, X } from "lucide-react";
import { Document } from "@/lib/db/schema";
import { IconPicker } from "@/components/icon-picker";
import { Button } from "@/components/ui/button";
import TextareaAutosize from "react-textarea-autosize";
import { useCoverImage } from "@/hooks/use-cover-image";
import { useDebounceCallback } from "usehooks-ts";
import { useDocumentStore } from "@/hooks/use-document-store";

interface ToolbarProps {
    initialData: Document;
    preview?: boolean;
}

export const Toolbar = ({
    initialData,
    preview
}: ToolbarProps) => {
    const inputRef = useRef<ElementRef<"textarea">>(null);
    const [isEditing, setIsEditing] = useState(false);
    const { title, setTitle } = useDocumentStore();

    const coverImage = useCoverImage();

    const enableInput = () => {
        if (preview) return;

        setIsEditing(true);
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 0);
    };

    const disableInput = () => setIsEditing(false);

    const debouncedUpdate = useDebounceCallback((value: string) => {
        fetch(`/api/documents/${initialData.id}`, {
            method: "PATCH",
            body: JSON.stringify({ title: value || "Untitled" }),
        });
    }, 500);

    const onInput = (value: string) => {
        setTitle(value);
        debouncedUpdate(value);
    };

    useEffect(() => {
        setTitle(initialData.title);
    }, [initialData.title, setTitle]);

    const onKeyDown = (
        event: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
        if (event.key === "Enter") {
            event.preventDefault();
            disableInput();
        }
    };

    const onIconSelect = (icon: string) => {
        fetch(`/api/documents/${initialData.id}`, {
            method: "PATCH",
            body: JSON.stringify({ emoji: icon }),
        });
    };

    const onRemoveIcon = () => {
        fetch(`/api/documents/${initialData.id}`, {
            method: "PATCH",
            body: JSON.stringify({ emoji: null }),
        });
    };

    if (!isEditing && !preview) {
        return (
            <div className="pl-[54px] group relative">
                {!!initialData.emoji && !preview && (
                    <div className="flex items-center gap-x-2 group/icon pt-6">
                        <IconPicker onChange={onIconSelect}>
                            <p className="text-6xl hover:opacity-75 transition">
                                {initialData.emoji}
                            </p>
                        </IconPicker>
                        <Button
                            onClick={onRemoveIcon}
                            className="rounded-full opacity-0 group-hover/icon:opacity-100 transition text-muted-foreground text-xs"
                            variant="outline"
                            size="icon"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-x-1 py-4">
                    {!initialData.emoji && !preview && (
                        <IconPicker asChild onChange={onIconSelect}>
                            <Button
                                className="text-muted-foreground text-xs"
                                variant="outline"
                                size="sm"
                            >
                                <Smile className="h-4 w-4 mr-2" />
                                Add icon
                            </Button>
                        </IconPicker>
                    )}
                    {!initialData.coverImage && !preview && (
                        <Button
                            onClick={coverImage.onOpen}
                            className="text-muted-foreground text-xs"
                            variant="outline"
                            size="sm"
                        >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Add cover
                        </Button>
                    )}
                </div>
                <div
                    onClick={enableInput}
                    className="pb-[11.5px] text-5xl font-bold break-words outline-none text-[#3F3F3F] dark:text-[#CFCFCF]"
                >
                    {title || "Untitled"}
                </div>
            </div>
        );
    }

    return (
        <div className="pl-[54px] group relative">
            {!!initialData.emoji && !preview && (
                <div className="flex items-center gap-x-2 group/icon pt-6">
                    <IconPicker onChange={onIconSelect}>
                        <p className="text-6xl hover:opacity-75 transition">
                            {initialData.emoji}
                        </p>
                    </IconPicker>
                    <Button
                        onClick={onRemoveIcon}
                        className="rounded-full opacity-0 group-hover/icon:opacity-100 transition text-muted-foreground text-xs"
                        variant="outline"
                        size="icon"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            {!!initialData.emoji && preview && (
                <p className="text-6xl pt-6">
                    {initialData.emoji}
                </p>
            )}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-x-1 py-4">
                {!initialData.emoji && !preview && (
                    <IconPicker asChild onChange={onIconSelect}>
                        <Button
                            className="text-muted-foreground text-xs"
                            variant="outline"
                            size="sm"
                        >
                            <Smile className="h-4 w-4 mr-2" />
                            Add icon
                        </Button>
                    </IconPicker>
                )}
                {!initialData.coverImage && !preview && (
                    <Button
                        onClick={coverImage.onOpen}
                        className="text-muted-foreground text-xs"
                        variant="outline"
                        size="sm"
                    >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Add cover
                    </Button>
                )}
            </div>
            {preview ? (
                <p className="pb-[11.5px] text-5xl font-bold break-words outline-none text-[#3F3F3F] dark:text-[#CFCFCF]">
                    {initialData.title}
                </p>
            ) : (
                <TextareaAutosize
                    ref={inputRef}
                    onBlur={disableInput}
                    onKeyDown={onKeyDown}
                    value={title}
                    onChange={(e) => onInput(e.target.value)}
                    className="text-5xl bg-transparent font-bold break-words outline-none text-[#3F3F3F] dark:text-[#CFCFCF] resize-none w-full"
                />
            )}
        </div>
    );
};
