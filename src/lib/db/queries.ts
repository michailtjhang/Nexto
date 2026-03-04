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

// Create document in a workspace
export async function createDocument(data: {
    title: string;
    userId: string;
    workspaceId: string;
    parentId?: string;
}) {
    const result = await db
        .insert(documents)
        .values({
            title: data.title,
            userId: data.userId,
            workspaceId: data.workspaceId,
            parentId: data.parentId ?? null,
        })
        .returning();
    return result[0];
}

// WORKSPACE QUERIES

export async function createWorkspace(name: string, userId: string) {
    const ws = await db
        .insert(workspaces)
        .values({ name, userId })
        .returning();

    // Auto-add owner as member
    await db.insert(workspaceMembers).values({
        workspaceId: ws[0].id,
        userId,
        email: "owner@internal.com", // In a real app, get user email from Clerk
        role: "owner"
    });

    return ws[0];
}

export async function getWorkspacesByUserId(userId: string) {
    // Get workspaces where user is owner OR a member
    const memberOf = await db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, userId));

    const workspaceIds = memberOf.map(m => m.workspaceId);

    if (workspaceIds.length === 0) return [];

    return db
        .select()
        .from(workspaces)
        .where(or(
            eq(workspaces.userId, userId),
            ...workspaceIds.map(id => eq(workspaces.id, id))
        ));
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

// Update document
export async function updateDocument(
    id: string,
    userId: string,
    data: Partial<NewDocument>
) {
    const result = await db
        .update(documents)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(documents.id, id), eq(documents.userId, userId)))
        .returning();
    return result[0];
}

// Archive document (move to trash) — also archives children recursively via API
export async function archiveDocument(id: string, userId: string) {
    return db
        .update(documents)
        .set({ isArchived: true, updatedAt: new Date() })
        .where(and(eq(documents.id, id), eq(documents.userId, userId)))
        .returning();
}

// Restore document from trash
export async function restoreDocument(id: string, userId: string) {
    return db
        .update(documents)
        .set({ isArchived: false, updatedAt: new Date() })
        .where(and(eq(documents.id, id), eq(documents.userId, userId)))
        .returning();
}

// Permanently delete document
export async function deleteDocument(id: string, userId: string) {
    return db
        .delete(documents)
        .where(and(eq(documents.id, id), eq(documents.userId, userId)))
        .returning();
}
