import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const workspaces = pgTable("workspaces", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    userId: text("user_id").notNull(), // Owner
    isPersonal: boolean("is_personal").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workspaceMembers = pgTable("workspace_members", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text("workspace_id")
        .notNull()
        .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    userId: text("user_id"), // Optional until registered
    role: text("role").notNull().default("member"), // "owner" | "member"
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documents = pgTable("documents", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull().default("Untitled"),
    userId: text("user_id").notNull(),
    workspaceId: text("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
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
export type Workspace = typeof workspaces.$inferSelect;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
