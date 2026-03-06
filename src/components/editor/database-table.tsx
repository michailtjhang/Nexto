"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
    flexRender,
    RowData,
} from "@tanstack/react-table";
import { DatabaseColumn, DatabaseRow } from "@/lib/db/schema";
import { Plus, Type, Calendar, Hash, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Declare augmented module for meta
declare module "@tanstack/react-table" {
    interface TableMeta<TData extends RowData> {
        updateCell: (rowId: string, columnId: string, value: string) => void;
    }
}

interface DatabaseTableProps {
    databaseId: string;
    initialColumns: DatabaseColumn[];
    initialRows: DatabaseRow[];
}

const COLUMN_TYPES = [
    { type: "text" as const, label: "Text", icon: Type },
    { type: "number" as const, label: "Number", icon: Hash },
    { type: "date" as const, label: "Date", icon: Calendar },
    { type: "select" as const, label: "Select", icon: ChevronDown },
];

function EditableCell({
    value: initialValue,
    row,
    column,
    colType,
    table,
}: {
    value: string;
    row: any;
    column: any;
    colType: DatabaseColumn["type"];
    table: any;
}) {
    const [value, setValue] = useState(initialValue ?? "");

    const onBlur = () => {
        if (value !== initialValue) {
            table.options.meta?.updateCell(row.original.id, column.id, value);
        }
    };

    useEffect(() => {
        setValue(initialValue ?? "");
    }, [initialValue]);

    if (colType === "date") {
        return (
            <input
                type="date"
                value={value}
                onChange={e => setValue(e.target.value)}
                onBlur={onBlur}
                className="w-full bg-transparent px-2 py-1 text-sm outline-none border-none focus:ring-1 focus:ring-primary/30 rounded"
            />
        );
    }

    if (colType === "number") {
        return (
            <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                onBlur={onBlur}
                className="w-full bg-transparent px-2 py-1 text-sm outline-none border-none focus:ring-1 focus:ring-primary/30 rounded"
            />
        );
    }

    return (
        <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={onBlur}
            className="w-full bg-transparent px-2 py-1 text-sm outline-none border-none focus:ring-1 focus:ring-primary/30 rounded"
        />
    );
}

export const DatabaseTable = ({
    databaseId,
    initialColumns,
    initialRows,
}: DatabaseTableProps) => {
    const [columns, setColumns] = useState<DatabaseColumn[]>(initialColumns ?? []);
    const [rows, setRows] = useState<DatabaseRow[]>(initialRows ?? []);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── New Column State ────────────────────────────────────────────────────
    const [newColName, setNewColName] = useState("");
    const [newColType, setNewColType] = useState<DatabaseColumn["type"]>("text");
    const [addColOpen, setAddColOpen] = useState(false);

    // ── Save Logic ──────────────────────────────────────────────────────────
    const scheduleSave = useCallback(
        (nextCols: DatabaseColumn[], nextRows: DatabaseRow[]) => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(async () => {
                await fetch(`/api/databases/${databaseId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ columns: nextCols, rows: nextRows }),
                });
            }, 800);
        },
        [databaseId]
    );

    // ── Cell Updates ────────────────────────────────────────────────────────
    const updateCell = useCallback(
        (rowId: string, colId: string, value: string) => {
            setRows(prev => {
                const next = prev.map(r =>
                    r.id === rowId ? { ...r, [colId]: value } : r
                );
                scheduleSave(columns, next);
                return next;
            });
        },
        [columns, scheduleSave]
    );

    // ── Add Row ─────────────────────────────────────────────────────────────
    const addRow = useCallback(() => {
        const newRow: DatabaseRow = { id: crypto.randomUUID() };
        columns.forEach(c => { newRow[c.id] = ""; });
        setRows(prev => {
            const next = [...prev, newRow];
            scheduleSave(columns, next);
            return next;
        });
    }, [columns, scheduleSave]);

    // ── Delete Row ──────────────────────────────────────────────────────────
    const deleteRow = useCallback(
        (rowId: string) => {
            setRows(prev => {
                const next = prev.filter(r => r.id !== rowId);
                scheduleSave(columns, next);
                return next;
            });
        },
        [columns, scheduleSave]
    );

    // ── Add Column ──────────────────────────────────────────────────────────
    const addColumn = useCallback(() => {
        if (!newColName.trim()) {
            toast.error("Column name cannot be empty.");
            return;
        }
        const newCol: DatabaseColumn = {
            id: crypto.randomUUID(),
            name: newColName.trim(),
            type: newColType,
        };
        const nextCols = [...columns, newCol];
        const nextRows = rows.map(r => ({ ...r, [newCol.id]: "" }));
        setColumns(nextCols);
        setRows(nextRows);
        scheduleSave(nextCols, nextRows);
        setNewColName("");
        setNewColType("text");
        setAddColOpen(false);
    }, [newColName, newColType, columns, rows, scheduleSave]);

    // ── React Table Columns ─────────────────────────────────────────────────
    const tableColumns: ColumnDef<DatabaseRow>[] = [
        ...columns.map(col => ({
            id: col.id,
            header: () => (
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    {col.type === "number" && <Hash className="h-3 w-3" />}
                    {col.type === "date" && <Calendar className="h-3 w-3" />}
                    {col.type === "text" && <Type className="h-3 w-3" />}
                    {col.type === "select" && <ChevronDown className="h-3 w-3" />}
                    {col.name}
                </span>
            ),
            accessorFn: (row: DatabaseRow) => row[col.id] ?? "",
            cell: ({ getValue, row, column, table }: any) => (
                <EditableCell
                    value={getValue() as string}
                    row={row}
                    column={column}
                    colType={col.type}
                    table={table}
                />
            ),
        })),
        // Action column
        {
            id: "_actions",
            header: () => null,
            cell: ({ row }: any) => (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover/row:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteRow(row.original.id)}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            ),
        },
    ];

    const table = useReactTable({
        data: rows,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        meta: { updateCell },
    });

    return (
        <div className="not-prose my-4 rounded-lg border border-border/60 overflow-hidden shadow-sm bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/30">
                <span className="text-sm font-medium text-primary">Database</span>
                <div className="flex gap-2">
                    {/* Add Column */}
                    <Popover open={addColOpen} onOpenChange={setAddColOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground">
                                <Plus className="h-3.5 w-3.5" />
                                Add Column
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 space-y-3" align="end">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Column</p>
                            <Input
                                placeholder="Column name..."
                                value={newColName}
                                onChange={e => setNewColName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && addColumn()}
                                className="h-8 text-sm"
                                autoFocus
                            />
                            <div className="grid grid-cols-2 gap-1.5">
                                {COLUMN_TYPES.map(({ type, label, icon: Icon }) => (
                                    <button
                                        key={type}
                                        onClick={() => setNewColType(type)}
                                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${newColType === type ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted text-muted-foreground hover:text-primary"}`}
                                    >
                                        <Icon className="h-3 w-3" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <Button size="sm" className="w-full h-8 text-xs" onClick={addColumn}>
                                Add Column
                            </Button>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className="border-b border-border/60 bg-muted/20">
                                {headerGroup.headers.map(header => (
                                    <th
                                        key={header.id}
                                        className="px-3 py-2 text-left font-medium text-muted-foreground text-xs whitespace-nowrap border-r border-border/30 last:border-r-0"
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={tableColumns.length}
                                    className="py-8 text-center text-sm text-muted-foreground"
                                >
                                    No rows yet. Click "Add Row" below.
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr
                                    key={row.id}
                                    className="group/row border-b border-border/30 last:border-b-0 hover:bg-muted/20 transition-colors"
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <td
                                            key={cell.id}
                                            className="border-r border-border/20 last:border-r-0"
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer - Add Row */}
            <div className="px-3 py-2 border-t border-border/40 bg-muted/10">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-primary"
                    onClick={addRow}
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add Row
                </Button>
            </div>
        </div>
    );
};
