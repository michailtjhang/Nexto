import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
    getRootDocuments,
    createDocument,
    searchDocuments,
} from "@/lib/db/queries";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, parentId, workspaceId, emoji, content, coverImage } = body;

        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
        }

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
    } catch (error) {
        console.error("[DOCUMENTS_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
