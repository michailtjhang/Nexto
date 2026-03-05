import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
    deleteWorkspace,
    getAllDocumentsInWorkspace,
} from "@/lib/db/queries";
import { UTApi } from "uploadthing/server";

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
        const coverImageKeys = documents
            .map(doc => doc.coverImage?.split("/").pop())
            .filter((key): key is string => !!key);

        if (coverImageKeys.length > 0) {
            const utapi = new UTApi();
            await utapi.deleteFiles(coverImageKeys);
        }

        await deleteWorkspace(workspaceId, userId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[WORKSPACE_DELETE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
