"use client";

import { useTheme } from "next-themes";
import {
    BlockNoteEditor,
    PartialBlock
} from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import {
    useCreateBlockNote
} from "@blocknote/react";
import {
    BlockNoteView
} from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";

interface EditorProps {
    onChange: (value: string) => void;
    initialContent?: any;
    editable?: boolean;
}

const Editor = ({
    onChange,
    initialContent,
    editable
}: EditorProps) => {
    const { resolvedTheme } = useTheme();
    const { startUpload } = useUploadThing("mediaUploader");

    const handleUpload = async (file: File) => {
        try {
            const res = await startUpload([file]);

            if (res?.[0].url) {
                return res[0].url;
            }
        } catch (error) {
            toast.error("Failed to upload file. Check your internet connection or file size.");
        }

        throw new Error("Failed to upload file");
    };

    const editor: BlockNoteEditor = useCreateBlockNote({
        initialContent: initialContent
            ? (typeof initialContent === "string"
                ? JSON.parse(initialContent)
                : initialContent) as PartialBlock[]
            : undefined,
        uploadFile: handleUpload,
    });

    return (
        <div className="min-h-full">
            <BlockNoteView
                editor={editor}
                editable={editable}
                theme={resolvedTheme === "dark" ? "dark" : "light"}
                onChange={() => {
                    onChange(JSON.stringify(editor.document, null, 2));
                }}
            />
        </div>
    );
};

export default Editor;
