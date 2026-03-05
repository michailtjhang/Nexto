import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
    addWorkspaceMember,
    getWorkspaceMembers,
    removeWorkspaceMember,
    isWorkspaceOwner,
    getWorkspaceMemberById,
} from "@/lib/db/queries";

// Nodemailer Transporter Configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const getInvitationHtml = (workspaceName: string, inviterName: string, loginUrl: string) => `
<div style="font-family: sans-serif; padding: 20px; backgroundColor: #f9f9f9; border-radius: 10px; border: 1px solid #ddd; max-width: 600px; margin: 0 auto">
    <h1 style="color: #333; font-size: 24px">Undangan Join Workspace! 🚀</h1>
    <p style="color: #555; font-size: 16px; line-height: 1.5">
        Halo! <strong>${inviterName}</strong> mengundang kamu untuk bergabung ke workspace <strong>"${workspaceName}"</strong> di Nexto.
    </p>
    <div style="text-align: center; margin: 30px 0">
        <a href="${loginUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold; display: inline-block">
            Buka Nexto Sekarang
        </a>
    </div>
    <p style="color: #888; font-size: 12px">
        Jika tombol di atas tidak berfungsi, salin URL ini ke browser kamu:<br />
        <a href="${loginUrl}" style="color: #4F46E5">${loginUrl}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0" />
    <p style="color: #aaa; font-size: 11px; text-align: center">
        Pesan ini dikirim otomatis oleh sistem Nexto (via SMTP).
    </p>
</div>
`;

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

        // Verify requester is owner
        const isOwner = await isWorkspaceOwner(workspaceId, userId);
        if (!isOwner) {
            return NextResponse.json({ error: "Only owners can invite members" }, { status: 403 });
        }

        // Block invitations to personal workspaces
        const workspace = await db
            .select()
            .from(workspaces)
            .where(eq(workspaces.id, workspaceId))
            .then(res => res[0]);

        if (workspace?.isPersonal) {
            return NextResponse.json({ error: "Cannot invite members to personal workspace" }, { status: 400 });
        }

        // 1. Add to database
        const member = await addWorkspaceMember(workspaceId, email);

        // 2. Try to send email via SMTP (Nodemailer)
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            console.log("DEBUG: SMTP Config found. Attempting to send invitation email...");
            try {
                const workspace = await db
                    .select()
                    .from(workspaces)
                    .where(eq(workspaces.id, workspaceId))
                    .then(res => res[0]);

                if (workspace) {
                    const inviterName = user.firstName || user.username || "Seseorang";
                    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://nexto-ten.vercel.app'}/documents`;

                    await transporter.sendMail({
                        from: `"${inviterName} via Nexto" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
                        to: email,
                        subject: `Undangan Join Workspace: ${workspace.name}`,
                        html: getInvitationHtml(workspace.name, inviterName, loginUrl),
                    });

                    console.log(`DEBUG: Invitation email sent successfully to ${email} via SMTP.`);
                } else {
                    console.error("DEBUG: Workspace not found for ID:", workspaceId);
                }
            } catch (emailError) {
                console.error("DEBUG: Failed to send email via SMTP:", emailError);
            }
        } else {
            console.warn("DEBUG: SMTP credentials not fully defined. Skipping email notification.");
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

        const memberToRemove = await getWorkspaceMemberById(memberId);
        if (!memberToRemove) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        // Verify requester is owner
        const isOwner = await isWorkspaceOwner(memberToRemove.workspaceId, userId);
        if (!isOwner && memberToRemove.userId !== userId) {
            return NextResponse.json({ error: "Unauthorized to remove member" }, { status: 403 });
        }

        await removeWorkspaceMember(memberId);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
