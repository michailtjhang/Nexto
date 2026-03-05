import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Resend } from "resend";
import { InvitationEmail } from "@/components/emails/invitation-email";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
    addWorkspaceMember,
    getWorkspaceMembers,
    removeWorkspaceMember,
} from "@/lib/db/queries";

// Initialize Resend with a dummy key if not provided to prevent crashes on startup, 
// though we'll check properly inside the handler.
const resend = new Resend(process.env.RESEND_API_KEY || "temp");

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const workspaceId = searchParams.get("workspaceId");

        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
        }

        const members = await getWorkspaceMembers(workspaceId);
        return NextResponse.json(members);
    } catch (error) {
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

        const body = await req.json();
        const { email, workspaceId } = body;

        // 1. Add to database
        const member = await addWorkspaceMember(workspaceId, email);

        // 2. Try to send email via Resend
        if (process.env.RESEND_API_KEY) {
            console.log("DEBUG: Resend API Key found. Attempting to send email...");
            try {
                const workspace = await db
                    .select()
                    .from(workspaces)
                    .where(eq(workspaces.id, workspaceId))
                    .then(res => res[0]);

                if (workspace) {
                    const data = await resend.emails.send({
                        from: 'Nexto <onboarding@resend.dev>',
                        to: email,
                        subject: `Undangan Join Workspace: ${workspace.name}`,
                        react: React.createElement(InvitationEmail, {
                            workspaceName: workspace.name,
                            inviterName: user.firstName || user.username || "Seseorang",
                            loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://nexto-ten.vercel.app'}/documents`
                        }),
                    });

                    if (data.error) {
                        console.error("DEBUG: Resend API Error:", JSON.stringify(data.error, null, 2));
                    } else {
                        console.log(`DEBUG: Invitation email sent successfully, ID: ${data.data?.id}`);
                    }
                } else {
                    console.error("DEBUG: Workspace not found for ID:", workspaceId);
                }
            } catch (emailError) {
                console.error("DEBUG: Exception in Resend logic:", emailError);
            }
        } else {
            console.error("DEBUG: RESEND_API_KEY is not defined in environment variables.");
        }

        return NextResponse.json(member[0]);
    } catch (error) {
        console.error("DEBUG: Member invitation error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const memberId = searchParams.get("memberId");

        if (!memberId) {
            return NextResponse.json({ error: "Member ID required" }, { status: 400 });
        }

        await removeWorkspaceMember(memberId);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
