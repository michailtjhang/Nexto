"use client";

import Image from "next/image";
import { ImageIcon, X } from "lucide-react";
import { useParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoverImage } from "@/hooks/use-cover-image";

interface CoverProps {
    url?: string;
    preview?: boolean;
}

export const Cover = ({
    url,
    preview,
}: CoverProps) => {
    const params = useParams();
    const coverImage = useCoverImage();

    const onRemove = async () => {
        if (url) {
            // Extract fileKey from URL (assuming https://utfs.io/f/fileKey)
            const fileKey = url.split("/").pop();

            if (fileKey) {
                await fetch("/api/uploadthing/delete", {
                    method: "POST",
                    body: JSON.stringify({ fileKey }),
                });
            }
        }

        await fetch(`/api/documents/${params?.documentId}`, {
            method: "PATCH",
            body: JSON.stringify({ coverImage: null }),
        });
    };

    return (
        <div className={cn(
            "relative w-full h-[35vh] group",
            !url && "h-[12vh]",
            url && "bg-muted"
        )}>
            {!!url && (
                <Image
                    src={url}
                    fill
                    alt="Cover"
                    className="object-cover"
                />
            )}
            {url && !preview && (
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-5 right-5 flex items-center gap-x-2">
                    <Button
                        onClick={() => coverImage.onReplace(url)}
                        className="text-muted-foreground text-xs"
                        variant="outline"
                        size="sm"
                    >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Change cover
                    </Button>
                    <Button
                        onClick={onRemove}
                        className="text-muted-foreground text-xs"
                        variant="outline"
                        size="sm"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                    </Button>
                </div>
            )}
        </div>
    );
};

Cover.Skeleton = function CoverSkeleton() {
    return (
        <Skeleton className="w-full h-[12vh]" />
    );
};
