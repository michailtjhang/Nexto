"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/modals/confirm-modal";

interface BannerProps {
    documentId: string;
}

export const Banner = ({
    documentId
}: BannerProps) => {
    const router = useRouter();

    const onRemove = () => {
        const promise = fetch(`/api/documents/${documentId}`, {
            method: "DELETE",
        })
            .then(() => router.push("/documents"));

        toast.promise(promise, {
            loading: "Deleting note...",
            success: "Note deleted!",
            error: "Failed to delete note.",
        });
    };

    const onRestore = () => {
        const promise = fetch(`/api/documents/${documentId}/restore`, {
            method: "PATCH",
        });

        toast.promise(promise, {
            loading: "Restoring note...",
            success: "Note restored!",
            error: "Failed to restore note.",
        });
    };

    return (
        <div className="w-full bg-rose-500 text-center text-sm p-2 text-white flex items-center justify-center gap-x-2">
            <p>
                This page is in the Trash.
            </p>
            <Button
                size="sm"
                onClick={onRestore}
                className="border-white bg-transparent hover:bg-primary/5 text-white hover:text-white p-1 px-2 h-auto font-normal"
            >
                Restore page
            </Button>
            <ConfirmModal onConfirm={onRemove}>
                <Button
                    size="sm"
                    className="border-white bg-transparent hover:bg-primary/5 text-white hover:text-white p-1 px-2 h-auto font-normal"
                >
                    Delete permanently
                </Button>
            </ConfirmModal>
        </div>
    );
};
