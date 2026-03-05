import { db } from "./index";
import { documents, workspaces, workspaceMembers, type NewDocument, type Workspace, type WorkspaceMember } from "./schema";
import { eq, and, isNull, isNotNull, desc, or } from "drizzle-orm";

// Get all non-archived documents for a workspace (top level)
export async function getRootDocuments(workspaceId: string) {
    return db
        .select()
        .from(documents)
        .where(
            and(
                eq(documents.workspaceId, workspaceId),
                eq(documents.isArchived, false),
                isNull(documents.parentId)
            )
        )
        .orderBy(desc(documents.createdAt));
}

// Get child documents in a workspace
export async function getChildDocuments(workspaceId: string, parentId: string) {
    return db
        .select()
        .from(documents)
        .where(
            and(
                eq(documents.workspaceId, workspaceId),
                eq(documents.isArchived, false),
                eq(documents.parentId, parentId)
            )
        )
        .orderBy(desc(documents.createdAt));
}

// Get single document by ID
export async function getDocumentById(id: string) {
    const result = await db
        .select()
        .from(documents)
        .where(eq(documents.id, id));
    return result[0] ?? null;
}

// Get archived (trash) documents for a user
export async function getArchivedDocuments(userId: string) {
    return db
        .select()
        .from(documents)
        .where(
            and(eq(documents.userId, userId), eq(documents.isArchived, true))
        )
        .orderBy(desc(documents.updatedAt));
}

// Search documents by title within a workspace
export async function searchDocuments(workspaceId: string, query: string) {
    const allDocs = await db
        .select()
        .from(documents)
        .where(
            and(
                eq(documents.workspaceId, workspaceId),
                eq(documents.isArchived, false),
                eq(documents.isPublished, false)
            )
        );
    return allDocs.filter((doc) =>
        doc.title.toLowerCase().includes(query.toLowerCase())
    );
}

export async function createDocument(data: {
    title: string;
    userId: string;
    workspaceId: string;
    parentId?: string;
    content?: any;
    emoji?: string;
    coverImage?: string;
}) {
    const result = await db
        .insert(documents)
        .values({
            title: data.title,
            userId: data.userId,
            workspaceId: data.workspaceId,
            parentId: data.parentId ?? null,
            content: data.content ?? null,
            emoji: data.emoji ?? null,
            coverImage: data.coverImage ?? null,
        })
        .returning();
    return result[0];
}

// WORKSPACE QUERIES

export async function createWorkspace(name: string, userId: string, email: string, isPersonal = false) {
    try {
        const ws = await db
            .insert(workspaces)
            .values({ name, userId, isPersonal })
            .returning();

        if (!ws || ws.length === 0) {
            throw new Error("Failed to insert workspace");
        }

        // Auto-add owner as member with actual email
        await db.insert(workspaceMembers).values({
            workspaceId: ws[0].id,
            userId,
            email,
            role: "owner"
        });

        return ws[0];
    } catch (error) {
        console.error("DEBUG: createWorkspace error:", error);
        throw error;
    }
}

export async function getWorkspacesByUserId(userId: string, email?: string) {
    // 1. If we have an email, first link any unlinked invitations
    if (email) {
        await db.update(workspaceMembers)
            .set({ userId })
            .where(and(
                eq(workspaceMembers.email, email),
                isNull(workspaceMembers.userId)
            ));
    }

    // 2. Get workspaces where user is owner OR a member (now that we've updated memberships)
    const memberOf = await db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, userId));

    const workspaceIds = memberOf.map(m => m.workspaceId);

    // If they aren't owner or member of anything, return empty
    // (A separate check in the API handles creating the default workspace)
    const ownedWorkspaces = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.userId, userId));

    const ownedIds = ownedWorkspaces.map(w => w.id);
    const allIds = Array.from(new Set([...workspaceIds, ...ownedIds]));

    if (allIds.length === 0) return [];

    return db
        .select()
        .from(workspaces)
        .where(or(...allIds.map(id => eq(workspaces.id, id))));
}

export async function addWorkspaceMember(workspaceId: string, email: string) {
    return db
        .insert(workspaceMembers)
        .values({ workspaceId, email })
        .returning();
}

export async function getWorkspaceMembers(workspaceId: string) {
    return db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, workspaceId));
}

export async function removeWorkspaceMember(memberId: string) {
    return db
        .delete(workspaceMembers)
        .where(eq(workspaceMembers.id, memberId))
        .returning();
}

export async function getWorkspaceMemberById(id: string) {
    const result = await db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.id, id));
    return result[0] ?? null;
}

export async function isWorkspaceOwner(workspaceId: string, userId: string) {
    const member = await db
        .select()
        .from(workspaceMembers)
        .where(and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, userId),
            eq(workspaceMembers.role, "owner")
        ));
    return member.length > 0;
}

export async function isMemberOfWorkspace(workspaceId: string, userId: string, email?: string) {
    const conditions = [eq(workspaceMembers.workspaceId, workspaceId)];

    if (email) {
        conditions.push(or(
            eq(workspaceMembers.userId, userId),
            eq(workspaceMembers.email, email)
        )!);
    } else {
        conditions.push(eq(workspaceMembers.userId, userId));
    }

    const member = await db
        .select()
        .from(workspaceMembers)
        .where(and(...conditions));

    return member.length > 0;
}

export async function deleteWorkspace(workspaceId: string, userId: string) {
    // Only owner can delete AND it must not be a personal workspace
    return db
        .delete(workspaces)
        .where(and(
            eq(workspaces.id, workspaceId),
            eq(workspaces.userId, userId),
            eq(workspaces.isPersonal, false)
        ))
        .returning();
}

export async function getPersonalWorkspace(userId: string) {
    const result = await db
        .select()
        .from(workspaces)
        .where(and(
            eq(workspaces.userId, userId),
            eq(workspaces.isPersonal, true)
        ));
    return result[0] ?? null;
}

// Update document (Allowed for workspace members)
export async function updateDocument(
    id: string,
    data: Partial<NewDocument>
) {
    const result = await db
        .update(documents)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(documents.id, id))
        .returning();
    return result[0];
}

// Archive document (move to trash)
export async function archiveDocument(id: string) {
    return db
        .update(documents)
        .set({ isArchived: true, updatedAt: new Date() })
        .where(eq(documents.id, id))
        .returning();
}

// Restore document from trash
export async function restoreDocument(id: string) {
    return db
        .update(documents)
        .set({ isArchived: false, updatedAt: new Date() })
        .where(eq(documents.id, id))
        .returning();
}

// Permanently delete document
export async function deleteDocument(id: string) {
    return db
        .delete(documents)
        .where(eq(documents.id, id))
        .returning();
}
