import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
    getArchivedDocumentsInWorkspace,
    emptyTrashInWorkspace,
    isMemberOfWorkspace,
} from "@/lib/db/queries";
import { UTApi } from "uploadthing/server";

export async function POST(
    req: NextRequest
) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

        const { workspaceId } = await req.json();

        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
        }

        // Verify membership
        const isMember = await isMemberOfWorkspace(workspaceId, userId, email);
        if (!isMember) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get all documents in trash to collect cover images
        const archivedDocs = await getArchivedDocumentsInWorkspace(workspaceId);

        // 2. Collect all coverImage keys
        const coverImageKeys = archivedDocs
            .map(doc => doc.coverImage?.split("/").pop())
            .filter((key): key is string => !!key);

        // 3. Delete from UploadThing if any exist
        if (coverImageKeys.length > 0) {
            const utapi = new UTApi();
            await utapi.deleteFiles(coverImageKeys);
        }

        // 4. Delete from DB
        await emptyTrashInWorkspace(workspaceId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[TRASH_EMPTY_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
