"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import {
    Dialog,
    DialogContent,
    DialogHeader,
} from "@/components/ui/dialog";
import { useCoverImage } from "@/hooks/use-cover-image";
import { SingleImageDropzone } from "@/components/single-image-dropzone";
import { useUploadThing } from "@/lib/uploadthing";

export const CoverImageModal = () => {
    const params = useParams();
    const coverImage = useCoverImage();
    const [file, setFile] = useState<File>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { startUpload } = useUploadThing("imageUploader");

    const onClose = () => {
        setFile(undefined);
        setIsSubmitting(false);
        coverImage.onClose();
    };

    const onChange = async (file?: File) => {
        if (file) {
            setIsSubmitting(true);
            setFile(file);

            const res = await startUpload([file]);

            if (res && res[0]) {
                await fetch(`/api/documents/${params?.documentId}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        coverImage: res[0].url,
                    }),
                });

                onClose();
            }
        }
    };

    return (
        <Dialog open={coverImage.isOpen} onOpenChange={coverImage.onClose}>
            <DialogContent>
                <DialogHeader>
                    <h2 className="text-center text-lg font-semibold">
                        Cover Image
                    </h2>
                </DialogHeader>
                <SingleImageDropzone
                    className="w-full outline-none"
                    disabled={isSubmitting}
                    value={file}
                    onChange={onChange}
                />
            </DialogContent>
        </Dialog>
    );
};
