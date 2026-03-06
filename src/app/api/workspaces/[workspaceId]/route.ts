import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
    deleteWorkspace,
    getAllDocumentsInWorkspace,
} from "@/lib/db/queries";
import { UTApi } from "uploadthing/server";
import { extractMediaUrls, getFileKeyFromUrl } from "@/lib/uploadthing-utils";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { workspaceId } = await params;

        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
        }

        const documents = await getAllDocumentsInWorkspace(workspaceId);
        const allKeys: string[] = [];

        documents.forEach(doc => {
            if (doc.coverImage) {
                const key = getFileKeyFromUrl(doc.coverImage);
                if (key) allKeys.push(key);
            }

            const contentUrls = extractMediaUrls(doc.content);
            contentUrls.forEach(url => {
                const key = getFileKeyFromUrl(url);
                if (key) allKeys.push(key);
            });
        });

        if (allKeys.length > 0) {
            try {
                const utapi = new UTApi();
                await utapi.deleteFiles(allKeys);
            } catch (error) {
                console.error("[WORKSPACE_MEDIA_CLEANUP_DELETE]", error);
            }
        }

        await deleteWorkspace(workspaceId, userId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[WORKSPACE_DELETE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
