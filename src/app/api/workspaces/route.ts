import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
    getWorkspacesByUserId,
    createWorkspace,
    getPersonalWorkspace,
} from "@/lib/db/queries";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

        let workspaces = await getWorkspacesByUserId(userId, email);

        // Ensure user has a personal workspace
        let personalWs = await getPersonalWorkspace(userId);
        if (!personalWs) {
            personalWs = await createWorkspace("My Workspace", userId, email!, true);
            // Refresh list to include newly created personal workspace
            workspaces = await getWorkspacesByUserId(userId, email);
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
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

        const body = await req.json();
        const { name } = body;

        const workspace = await createWorkspace(name || "Untitled Workspace", userId, email!, false);

        return NextResponse.json(workspace);
    } catch (error) {
        console.error("[WORKSPACES_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
