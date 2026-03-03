import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull().default("Untitled"),
    userId: text("user_id").notNull(),
    parentId: text("parent_id"),
    content: jsonb("content"),
    emoji: text("emoji"),
    coverImage: text("cover_image"),
    isPublished: boolean("is_published").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
