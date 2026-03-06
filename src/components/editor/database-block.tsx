"use client";

import { createReactBlockSpec } from "@blocknote/react";
import { DatabaseTable } from "./database-table";
import { useState, useEffect } from "react";
import type { DatabaseColumn, DatabaseRow } from "@/lib/db/schema";

export const DatabaseBlock = createReactBlockSpec(
    {
        type: "databaseBlock",
        propSchema: {
            databaseId: { default: "" },
        },
        content: "none",
    },
    {
        render: ({ block }) => {
            const databaseId = block.props.databaseId;
            const [columns, setColumns] = useState<DatabaseColumn[]>([]);
            const [rows, setRows] = useState<DatabaseRow[]>([]);
            const [isLoading, setIsLoading] = useState(true);
            const [error, setError] = useState<string | null>(null);

            useEffect(() => {
                if (!databaseId) {
                    setIsLoading(false);
                    setError("No database ID provided.");
                    return;
                }

                const fetchDb = async () => {
                    try {
                        const res = await fetch(`/api/databases/${databaseId}`);
                        if (!res.ok) throw new Error("Failed to load database");
                        const data = await res.json();
                        setColumns((data.columns as DatabaseColumn[]) ?? []);
                        setRows((data.rows as DatabaseRow[]) ?? []);
                    } catch (err) {
                        setError("Failed to load database.");
                    } finally {
                        setIsLoading(false);
                    }
                };

                fetchDb();
            }, [databaseId]);

            if (isLoading) {
                return (
                    <div className="my-4 rounded-lg border border-border/40 bg-muted/20 p-8 text-center text-sm text-muted-foreground animate-pulse">
                        Loading database...
                    </div>
                );
            }

            if (error) {
                return (
                    <div className="my-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                        {error}
                    </div>
                );
            }

            return (
                <div contentEditable={false}>
                    <DatabaseTable
                        databaseId={databaseId}
                        initialColumns={columns}
                        initialRows={rows}
                    />
                </div>
            );
        },
    }
);
