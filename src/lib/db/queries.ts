import { db } from "./index";
import { documents, type NewDocument } from "./schema";
import { eq, and, isNull, isNotNull, desc } from "drizzle-orm";

// Get all non-archived documents for a user (top level)
export async function getRootDocuments(userId: string) {
    return db
        .select()
        .from(documents)
        .where(
            and(
                eq(documents.userId, userId),
                eq(documents.isArchived, false),
                isNull(documents.parentId)
            )
        )
        .orderBy(desc(documents.createdAt));
}

// Get child documents
export async function getChildDocuments(userId: string, parentId: string) {
    return db
        .select()
        .from(documents)
        .where(
            and(
                eq(documents.userId, userId),
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

// Search documents by title
export async function searchDocuments(userId: string, query: string) {
    const allDocs = await db
        .select()
        .from(documents)
        .where(
            and(
                eq(documents.userId, userId),
                eq(documents.isArchived, false),
                eq(documents.isPublished, false)
            )
        );
    return allDocs.filter((doc) =>
        doc.title.toLowerCase().includes(query.toLowerCase())
    );
}

// Create document
export async function createDocument(data: {
    title: string;
    userId: string;
    parentId?: string;
}) {
    const result = await db
        .insert(documents)
        .values({
            title: data.title,
            userId: data.userId,
            parentId: data.parentId ?? null,
        })
        .returning();
    return result[0];
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
