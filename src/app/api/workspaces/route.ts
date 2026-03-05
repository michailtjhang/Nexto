import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
    getWorkspacesByUserId,
    createWorkspace,
    addWorkspaceMember,
    getWorkspaceMembers,
} from "@/lib/db/queries";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

        const workspaces = await getWorkspacesByUserId(userId, email);

        // If user has no workspaces, create a default one
        if (workspaces.length === 0) {
            const defaultWs = await createWorkspace("My Workspace", userId);
            return NextResponse.json([defaultWs]);
        }

        return NextResponse.json(workspaces);
    } catch (error) {
        console.error("[WORKSPACES_GET]", error);
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
        const { name } = body;

        const workspace = await createWorkspace(name || "Untitled Workspace", userId);

        return NextResponse.json(workspace);
    } catch (error) {
        console.error("[WORKSPACES_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
