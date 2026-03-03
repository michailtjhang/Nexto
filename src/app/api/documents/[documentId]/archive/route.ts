import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { archiveDocument, getChildDocuments } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function archiveRecursive(docId: string, userId: string) {
    await archiveDocument(docId, userId);
    const children = await getChildDocuments(userId, docId);
    for (const child of children) {
        await archiveRecursive(child.id, userId);
    }
}

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
        await archiveRecursive(documentId, userId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[ARCHIVE_PATCH]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
