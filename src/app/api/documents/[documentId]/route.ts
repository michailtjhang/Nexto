import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
    getDocumentById,
    updateDocument,
    archiveDocument,
    restoreDocument,
    deleteDocument,
    getChildDocuments,
    getArchivedDocuments,
} from "@/lib/db/queries";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ documentId: string }> }
) {
    try {
        const { userId } = await auth();
        const { documentId } = await params;

        const doc = await getDocumentById(documentId);
        if (!doc) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // If not published and not owner
        if (!doc.isPublished && doc.userId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json(doc);
    } catch (error) {
        console.error("[DOCUMENT_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
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
        const body = await req.json();

        const doc = await updateDocument(documentId, userId, body);
        return NextResponse.json(doc);
    } catch (error) {
        console.error("[DOCUMENT_PATCH]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ documentId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { documentId } = await params;
        const result = await deleteDocument(documentId, userId);

        return NextResponse.json(result[0]);
    } catch (error) {
        console.error("[DOCUMENT_DELETE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
