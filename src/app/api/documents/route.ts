import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
    getRootDocuments,
    createDocument,
    searchDocuments,
    isMemberOfWorkspace,
} from "@/lib/db/queries";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");
        const workspaceId = searchParams.get("workspaceId");

        if (!workspaceId && !query) {
            return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
        }

        if (query) {
            const docs = await searchDocuments(workspaceId || "", query);
            return NextResponse.json(docs);
        }

        // Verify membership for listing
        const isMember = await isMemberOfWorkspace(workspaceId!, userId, email);
        if (!isMember) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const docs = await getRootDocuments(workspaceId!);
        return NextResponse.json(docs);
    } catch (error) {
        console.error("[DOCUMENTS_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

        let body;
        try {
            body = await req.json();
        } catch (e) {
            console.error("DEBUG: Failed to parse request JSON", e);
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        console.log("DEBUG: POST /api/documents body:", JSON.stringify(body, null, 2));
        const { title, parentId, workspaceId, emoji, content, coverImage } = body;

        if (!workspaceId) {
            console.error("DEBUG: POST /api/documents - Workspace ID is missing");
            return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
        }

        // Verify membership for creation
        const isMember = await isMemberOfWorkspace(workspaceId, userId, email);
        if (!isMember) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            const doc = await createDocument({
                title: title || "Untitled",
                userId,
                workspaceId,
                parentId,
                emoji,
                content,
                coverImage,
            });

            return NextResponse.json(doc);
        } catch (dbError) {
            console.error("DEBUG: Database error in createDocument:", dbError);
            return NextResponse.json({ error: "Database failure", details: dbError instanceof Error ? dbError.message : String(dbError) }, { status: 500 });
        }
    } catch (error) {
        console.error("[DOCUMENTS_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
