import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
    getDatabaseById,
    updateDatabase,
    isMemberOfWorkspace,
} from "@/lib/db/queries";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ databaseId: string }> }
) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
        const { databaseId } = await params;

        const db = await getDatabaseById(databaseId);
        if (!db) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        if (db.workspaceId) {
            const isMember = await isMemberOfWorkspace(db.workspaceId, userId, email);
            if (!isMember) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        return NextResponse.json(db);
    } catch (error) {
        console.error("[DATABASE_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ databaseId: string }> }
) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
        const { databaseId } = await params;
        const body = await req.json();

        const db = await getDatabaseById(databaseId);
        if (!db) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        if (db.workspaceId) {
            const isMember = await isMemberOfWorkspace(db.workspaceId, userId, email);
            if (!isMember) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        const updated = await updateDatabase(databaseId, body);
        return NextResponse.json(updated);
    } catch (error) {
        console.error("[DATABASE_PATCH]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
