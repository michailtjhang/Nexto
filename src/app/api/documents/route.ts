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

        if (query) {
            const docs = await searchDocuments(userId, query);
            return NextResponse.json(docs);
        }

        const docs = await getRootDocuments(userId);
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
        const { title, parentId } = body;

        const doc = await createDocument({
            title: title || "Untitled",
            userId,
            parentId,
        });

        return NextResponse.json(doc);
    } catch (error) {
        console.error("[DOCUMENTS_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
