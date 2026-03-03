import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { restoreDocument, getArchivedDocuments, getDocumentById } from "@/lib/db/queries";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ documentId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { documentId } = await params;

        // If document has a parent that is archived, restore parent too
        const doc = await getDocumentById(documentId);
        if (doc?.parentId) {
            const parent = await getDocumentById(doc.parentId);
            if (parent?.isArchived) {
                await restoreDocument(parent.id, userId);
            }
        }

        const result = await restoreDocument(documentId, userId);
        return NextResponse.json(result[0]);
    } catch (error) {
        console.error("[RESTORE_PATCH]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
