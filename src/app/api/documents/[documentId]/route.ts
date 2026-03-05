import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
    getDocumentById,
    updateDocument,
    deleteDocument,
    isMemberOfWorkspace,
} from "@/lib/db/queries";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ documentId: string }> }
) {
    try {
        const { userId } = await auth();
        const user = await currentUser();
        const { documentId } = await params;

        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

        const doc = await getDocumentById(documentId);
        if (!doc) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // If not published, check if user is owner OR a member of the workspace
        if (!doc.isPublished) {
            if (!doc.workspaceId) {
                return NextResponse.json({ error: "Invalid document state (no workspace)" }, { status: 400 });
            }
            const isMember = await isMemberOfWorkspace(doc.workspaceId!, userId, email);
            if (doc.userId !== userId && !isMember) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
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
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

        const { documentId } = await params;
        const body = await req.json();
        const { workspaceId, ...values } = body;

        const doc = await getDocumentById(documentId);
        if (!doc) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Verify membership
        if (!doc.workspaceId) {
            return NextResponse.json({ error: "Invalid document state (no workspace)" }, { status: 400 });
        }
        const isMember = await isMemberOfWorkspace(doc.workspaceId!, userId, email);
        if (doc.userId !== userId && !isMember) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const updatedDoc = await updateDocument(documentId, values);
        return NextResponse.json(updatedDoc);
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
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

        const { documentId } = await params;
        const doc = await getDocumentById(documentId);

        if (!doc) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Verify membership
        if (!doc.workspaceId) {
            return NextResponse.json({ error: "Invalid document state (no workspace)" }, { status: 400 });
        }
        const isMember = await isMemberOfWorkspace(doc.workspaceId!, userId, email);
        if (doc.userId !== userId && !isMember) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await deleteDocument(documentId);

        return NextResponse.json(result);
    } catch (error) {
        console.error("[DOCUMENT_DELETE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
