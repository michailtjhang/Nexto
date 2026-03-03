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
import { useUploadThing } from "@/lib/uploadthing";

interface EditorProps {
    onChange: (value: string) => void;
    initialContent?: string;
    editable?: boolean;
}

const Editor = ({
    onChange,
    initialContent,
    editable
}: EditorProps) => {
    const { resolvedTheme } = useTheme();
    const { startUpload } = useUploadThing("imageUploader");

    const handleUpload = async (file: File) => {
        const res = await startUpload([file]);

        if (res?.[0].url) {
            return res[0].url;
        }

        throw new Error("Failed to upload file");
    };

    const editor: BlockNoteEditor = useCreateBlockNote({
        initialContent: initialContent
            ? (JSON.parse(initialContent) as PartialBlock[])
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
