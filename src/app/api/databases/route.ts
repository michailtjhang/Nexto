import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
    createDatabase,
    isMemberOfWorkspace,
} from "@/lib/db/queries";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
        const body = await req.json();
        const { documentId, workspaceId, title } = body;

        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
        }

        // Verify membership
        const isMember = await isMemberOfWorkspace(workspaceId, userId, email);
        if (!isMember) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = await createDatabase({
            documentId,
            workspaceId,
            title: title || "Untitled Database",
            columns: [{ id: crypto.randomUUID(), name: "Name", type: "text" }] as any,
            rows: [] as any,
        });

        return NextResponse.json(db);
    } catch (error) {
        console.error("[DATABASES_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
