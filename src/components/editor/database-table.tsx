"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
    flexRender,
    RowData,
} from "@tanstack/react-table";
import { DatabaseColumn, DatabaseRow } from "@/lib/db/schema";
import { Plus, Type, Calendar, Hash, ChevronDown, Trash2, Maximize2, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";

// Declare augmented module for meta
declare module "@tanstack/react-table" {
    interface TableMeta<TData extends RowData> {
        updateCell: (rowId: string, columnId: string, value: string) => void;
        updateColumnOptions: (columnId: string, options: string[]) => void;
        openSidepeek: (rowId: string) => void;
        deleteRow: (rowId: string) => void;
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
    colOptions = [],
    isTitle,
    table,
}: {
    value: string;
    row: any;
    column: any;
    colType: DatabaseColumn["type"];
    colOptions?: string[];
    isTitle?: boolean;
    table: any;
}) {
    const [value, setValue] = useState(initialValue ?? "");
    const [open, setOpen] = useState(false);
    const [newOption, setNewOption] = useState("");

    const onBlur = () => {
        if (value !== initialValue) {
            table.options.meta?.updateCell(row.original.id, column.id, value);
        }
    };

    useEffect(() => {
        setValue(initialValue ?? "");
    }, [initialValue]);

    if (colType === "select") {
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button className="flex w-full min-h-[28px] items-center px-2 py-1 text-sm hover:bg-muted/50 rounded outline-none text-left">
                        {value ? <Badge variant="secondary" className="font-normal">{value}</Badge> : <span className="text-muted-foreground opacity-50">Empty</span>}
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                    <div className="space-y-1">
                        {colOptions.map((opt: string) => (
                            <button
                                key={opt}
                                className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded flex items-center gap-2"
                                onClick={() => {
                                    setValue(opt);
                                    table.options.meta?.updateCell(row.original.id, column.id, opt);
                                    setOpen(false);
                                }}
                            >
                                <Badge variant="secondary" className="font-normal pointer-events-none">{opt}</Badge>
                            </button>
                        ))}
                        {colOptions.length === 0 && (
                            <div className="text-xs text-muted-foreground px-2 py-1">No options yet. Type below to create one.</div>
                        )}
                    </div>
                    <div className="pt-2 mt-2 border-t border-border">
                        <Input
                            placeholder="Add option..."
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && newOption.trim()) {
                                    const trimmed = newOption.trim();
                                    if (!colOptions.includes(trimmed)) {
                                        table.options.meta?.updateColumnOptions(column.id, [...colOptions, trimmed]);
                                    }
                                    setValue(trimmed);
                                    table.options.meta?.updateCell(row.original.id, column.id, trimmed);
                                    setNewOption("");
                                    setOpen(false);
                                }
                            }}
                            className="h-8 text-sm"
                        />
                    </div>
                </PopoverContent>
            </Popover>
        )
    }

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
        <div className="relative group/cell flex items-center w-full h-full min-h-[32px]">
            <input
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                onBlur={onBlur}
                className={`w-full bg-transparent px-2 py-1 text-sm outline-none border-none focus:ring-1 focus:ring-primary/30 rounded ${isTitle ? "font-semibold placeholder:font-normal" : ""}`}
                placeholder={isTitle ? "Untitled" : ""}
            />
            {isTitle && (
                <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-[10px] font-semibold opacity-0 group-hover/cell:opacity-100 transition-opacity z-10 bg-background shadow-sm"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        table.options.meta?.openSidepeek(row.original.id);
                    }}
                >
                    <Maximize2 className="h-3 w-3 mr-1" />
                    OPEN
                </Button>
            )}
        </div>
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

    // ── Sidepeek State ──────────────────────────────────────────────────────
    const [sidepeekRowId, setSidepeekRowId] = useState<string | null>(null);

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

    const updateColumnOptions = useCallback(
        (colId: string, newOptions: string[]) => {
            setColumns(prev => {
                const next = prev.map(c =>
                    c.id === colId ? { ...c, options: newOptions } : c
                );
                scheduleSave(next, rows);
                return next;
            });
        },
        [rows, scheduleSave]
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
                if (sidepeekRowId === rowId) setSidepeekRowId(null);
                return next;
            });
        },
        [columns, scheduleSave, sidepeekRowId]
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
            options: newColType === "select" ? [] : undefined,
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
    const tableColumns: ColumnDef<DatabaseRow>[] = useMemo(() => [
        ...columns.map(col => ({
            id: col.id,
            header: () => (
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground w-full">
                    {col.type === "number" && <Hash className="h-3 w-3" />}
                    {col.type === "date" && <Calendar className="h-3 w-3" />}
                    {col.type === "text" && <Type className="h-3 w-3" />}
                    {col.type === "select" && <ChevronDown className="h-3 w-3" />}
                    {col.name}
                </span>
            ),
            accessorFn: (row: DatabaseRow) => row[col.id] ?? "",
            cell: ({ getValue, row, column, table }: any) => {
                const isTitle = col.id === columns[0]?.id; // Treat first column as title
                return (
                    <EditableCell
                        value={getValue() as string}
                        row={row}
                        column={column}
                        colType={col.type}
                        colOptions={col.options}
                        isTitle={isTitle}
                        table={table}
                    />
                );
            },
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
    ], [columns, deleteRow]);

    const table = useReactTable({
        data: rows,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        meta: {
            updateCell,
            updateColumnOptions,
            openSidepeek: (id: string) => setSidepeekRowId(id),
            deleteRow,
        },
    });

    const activeRow = sidepeekRowId ? rows.find(r => r.id === sidepeekRowId) : null;
    const titleColId = columns[0]?.id;

    return (
        <>
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
                                            className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs whitespace-nowrap border-r border-border/30 last:border-r-0"
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
                                        No rows yet. Click "+ New page" below.
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map(row => (
                                    <tr
                                        key={row.id}
                                        className="group/row border-b border-border/30 last:border-b-0 hover:bg-muted/10 transition-colors"
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <td
                                                key={cell.id}
                                                className="border-r border-border/20 last:border-r-0 relative"
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
                <div className="px-3 py-2 border-t border-border/40 hover:bg-muted/30 transition-colors group/footer cursor-pointer" onClick={addRow}>
                    <p className="flex items-center text-sm gap-1.5 text-muted-foreground group-hover/footer:text-primary px-1">
                        <Plus className="h-4 w-4" />
                        <span className="font-medium">New page</span>
                    </p>
                </div>
            </div>

            {/* Sidepeek Sheet */}
            <Sheet open={!!sidepeekRowId} onOpenChange={(open) => !open && setSidepeekRowId(null)}>
                <SheetContent className="sm:max-w-md w-full overflow-y-auto">
                    {activeRow && (
                        <>
                            <SheetHeader className="pb-6">
                                <SheetTitle className="text-3xl font-bold flex items-center gap-2 mt-4">
                                    <File className="h-8 w-8 text-muted-foreground" />
                                    {titleColId ? (activeRow[titleColId] || "Untitled") : "Item"}
                                </SheetTitle>
                                <SheetDescription>
                                    Edit row properties
                                </SheetDescription>
                            </SheetHeader>
                            <div className="space-y-4">
                                {columns.map(col => {
                                    // Render each property in the sidepeek
                                    const colIcon = COLUMN_TYPES.find(c => c.type === col.type)?.icon ?? Type;
                                    const IconNode = colIcon;

                                    return (
                                        <div key={col.id} className="grid grid-cols-[120px_1fr] items-center gap-4">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <IconNode className="h-4 w-4" />
                                                <span className="truncate">{col.name}</span>
                                            </div>
                                            <div className="w-full relative">
                                                <EditableCell
                                                    value={activeRow[col.id] ?? ""}
                                                    row={{ original: activeRow }}
                                                    column={{ id: col.id }}
                                                    colType={col.type}
                                                    colOptions={col.options}
                                                    isTitle={false}
                                                    table={table}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 pt-6 border-t border-border space-y-4">
                                <p className="text-sm text-muted-foreground">Page content could go here...</p>
                                {/* In a full implementation, you could integrate another BlockNote editor here synced to a separate document! */}
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
};
