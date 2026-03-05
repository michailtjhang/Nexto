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

const resend = new Resend(process.env.RESEND_API_KEY);

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
                        react: InvitationEmail({
                            workspaceName: workspace.name,
                            inviterName: user.firstName || user.username || "Seseorang",
                            loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://nexto-ten.vercel.app'}/documents`
                        }) as React.ReactElement,
                    });

                    if (data.error) {
                        console.error("DEBUG: Resend API Error:", data.error);
                    } else {
                        console.log(`DEBUG: Invitation email sent successfully, ID: ${data.data?.id}`);
                    }
                }
            } catch (emailError) {
                console.error("DEBUG: Exception in Resend logic:", emailError);
            }
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
