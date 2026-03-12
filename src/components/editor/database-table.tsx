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
import { 
    Plus, Type, Calendar, Hash, ChevronDown, Trash2, Maximize2, File, 
    ListFilter, CheckSquare, User, Paperclip, Link, Mail, Phone, 
    Divide, Link2, Info, Clock, UserCheck, Play, MapPin, 
    Fingerprint, Archive, Database, Github, Globe, MessageSquare
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
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
        updateCell: (rowId: string, columnId: string, value: any) => void;
        updateColumnOptions: (columnId: string, options: { id: string; label: string; color?: string }[]) => void;
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
    { type: "select" as const, label: "Select", icon: ChevronDown },
    { type: "multi-select" as const, label: "Multi-select", icon: ListFilter },
    { type: "status" as const, label: "Status", icon: CheckSquare },
    { type: "date" as const, label: "Date", icon: Calendar },
    { type: "person" as const, label: "Person", icon: User },
    { type: "files" as const, label: "Files & media", icon: Paperclip },
    { type: "checkbox" as const, label: "Checkbox", icon: CheckSquare },
    { type: "url" as const, label: "URL", icon: Link },
    { type: "email" as const, label: "Email", icon: Mail },
    { type: "phone" as const, label: "Phone", icon: Phone },
    { type: "formula" as const, label: "Formula", icon: Divide },
    { type: "relation" as const, label: "Relation", icon: Link2 },
    { type: "rollup" as const, label: "Rollup", icon: Info },
    { type: "created-time" as const, label: "Created time", icon: Clock },
    { type: "created-by" as const, label: "Created by", icon: UserCheck },
    { type: "last-edited-time" as const, label: "Last edited time", icon: Clock },
    { type: "last-edited-by" as const, label: "Last edited by", icon: UserCheck },
    { type: "button" as const, label: "Button", icon: Play },
    { type: "place" as const, label: "Place", icon: MapPin },
    { type: "no-id" as const, label: "No ID", icon: Fingerprint },
];

const CONNECTION_TYPES = [
    { type: "google-drive" as const, label: "Google Drive File", icon: Database },
    { type: "figma" as const, label: "Figma File", icon: Globe },
    { type: "github" as const, label: "GitHub Pull Requests", icon: Github },
    { type: "zendesk" as const, label: "Zendesk Ticket", icon: MessageSquare },
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
    value: any;
    row: any;
    column: any;
    colType: DatabaseColumn["type"];
    colOptions?: { id: string; label: string; color?: string }[];
    isTitle?: boolean;
    table: any;
}) {
    const { user } = useUser();
    const [value, setValue] = useState<any>(initialValue);
    const [open, setOpen] = useState(false);
    const [newOption, setNewOption] = useState("");

    const onBlur = () => {
        if (value !== initialValue) {
            table.options.meta?.updateCell(row.original.id, column.id, value);
        }
    };

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    if (colType === "select" || colType === "status") {
        const selectedOption = colOptions.find(opt => opt.id === value || opt.label === value);
        
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button className="flex w-full min-h-[28px] items-center px-2 py-1 text-sm hover:bg-muted/50 rounded outline-none text-left">
                        {selectedOption ? (
                            <Badge 
                                variant="secondary" 
                                className="font-normal"
                                style={{ backgroundColor: selectedOption.color ? `${selectedOption.color}33` : undefined, color: selectedOption.color }}
                            >
                                {selectedOption.label}
                            </Badge>
                        ) : (
                            <span className="text-muted-foreground opacity-50">Empty</span>
                        )}
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                    <div className="space-y-1">
                        {colOptions.map((opt) => (
                            <button
                                key={opt.id}
                                className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded flex items-center gap-2"
                                onClick={() => {
                                    setValue(opt.id);
                                    table.options.meta?.updateCell(row.original.id, column.id, opt.id);
                                    setOpen(false);
                                }}
                            >
                                <Badge 
                                    variant="secondary" 
                                    className="font-normal pointer-events-none"
                                    style={{ backgroundColor: opt.color ? `${opt.color}33` : undefined, color: opt.color }}
                                >
                                    {opt.label}
                                </Badge>
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
                                    const existing = colOptions.find(o => o.label === trimmed);
                                    if (!existing) {
                                        const nextOpt = { id: crypto.randomUUID(), label: trimmed };
                                        table.options.meta?.updateColumnOptions(column.id, [...colOptions, nextOpt]);
                                        setValue(nextOpt.id);
                                        table.options.meta?.updateCell(row.original.id, column.id, nextOpt.id);
                                    } else {
                                        setValue(existing.id);
                                        table.options.meta?.updateCell(row.original.id, column.id, existing.id);
                                    }
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

    if (colType === "multi-select") {
        const selectedIds = Array.isArray(value) ? value : (value ? [value] : []);
        const selectedOptions = colOptions.filter(opt => selectedIds.includes(opt.id));

        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button className="flex flex-wrap w-full min-h-[28px] items-center px-2 py-1 gap-1 text-sm hover:bg-muted/50 rounded outline-none text-left">
                        {selectedOptions.length > 0 ? (
                            selectedOptions.map(opt => (
                                <Badge 
                                    key={opt.id}
                                    variant="secondary" 
                                    className="font-normal"
                                    style={{ backgroundColor: opt.color ? `${opt.color}33` : undefined, color: opt.color }}
                                >
                                    {opt.label}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground opacity-50">Empty</span>
                        )}
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                    <div className="space-y-1">
                        {colOptions.map((opt) => {
                            const isSelected = selectedIds.includes(opt.id);
                            return (
                                <button
                                    key={opt.id}
                                    className={`w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded flex items-center justify-between gap-2 ${isSelected ? "bg-muted/50" : ""}`}
                                    onClick={() => {
                                        const nextIds = isSelected 
                                            ? selectedIds.filter(id => id !== opt.id)
                                            : [...selectedIds, opt.id];
                                        setValue(nextIds);
                                        table.options.meta?.updateCell(row.original.id, column.id, nextIds);
                                    }}
                                >
                                    <Badge 
                                        variant="secondary" 
                                        className="font-normal pointer-events-none"
                                        style={{ backgroundColor: opt.color ? `${opt.color}33` : undefined, color: opt.color }}
                                    >
                                        {opt.label}
                                    </Badge>
                                    {isSelected && <span className="text-[10px] text-primary font-bold">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="pt-2 mt-2 border-t border-border">
                        <Input
                            placeholder="Add option..."
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && newOption.trim()) {
                                    const trimmed = newOption.trim();
                                    const existing = colOptions.find(o => o.label === trimmed);
                                    if (!existing) {
                                        const nextOpt = { id: crypto.randomUUID(), label: trimmed };
                                        table.options.meta?.updateColumnOptions(column.id, [...colOptions, nextOpt]);
                                        const nextIds = [...selectedIds, nextOpt.id];
                                        setValue(nextIds);
                                        table.options.meta?.updateCell(row.original.id, column.id, nextIds);
                                    } else if (!selectedIds.includes(existing.id)) {
                                        const nextIds = [...selectedIds, existing.id];
                                        setValue(nextIds);
                                        table.options.meta?.updateCell(row.original.id, column.id, nextIds);
                                    }
                                    setNewOption("");
                                }
                            }}
                            className="h-8 text-sm"
                        />
                    </div>
                </PopoverContent>
            </Popover>
        )
    }

    if (colType === "checkbox") {
        return (
            <div className="flex items-center px-3 py-1.5 h-full">
                <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => {
                        const next = e.target.checked;
                        setValue(next);
                        table.options.meta?.updateCell(row.original.id, column.id, next);
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
            </div>
        );
    }

    if (colType === "created-time" || colType === "last-edited-time") {
        const dateStr = value ? new Date(value).toLocaleString() : new Date().toLocaleString();
        return (
            <div className="px-2 py-1 text-xs text-muted-foreground cursor-default">
                {dateStr}
            </div>
        );
    }

    if (colType === "created-by" || colType === "last-edited-by") {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1">
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {user?.imageUrl ? <img src={user.imageUrl} className="h-full w-full object-cover" /> : <User className="h-3 w-3" />}
                </div>
                <span className="text-xs text-muted-foreground truncate">{user?.fullName || user?.primaryEmailAddress?.emailAddress || "Anonymous"}</span>
            </div>
        );
    }

    if (colType === "person") {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1">
                 <div className="h-5 w-5 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                    <User className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground italic">Add person...</span>
            </div>
        );
    }

    if (colType === "files") {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 text-muted-foreground hover:bg-muted/50 transition-colors rounded cursor-pointer group">
                <Paperclip className="h-3 w-3" />
                <span className="text-xs">Add files...</span>
            </div>
        );
    }

    if (["google-drive", "figma", "github", "zendesk"].includes(colType)) {
        const Icon = CONNECTION_TYPES.find(c => c.type === colType)?.icon || Globe;
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 text-muted-foreground hover:bg-muted/50 transition-colors rounded cursor-pointer">
                <Icon className="h-3 w-3" />
                <span className="text-xs italic truncate">Paste link...</span>
            </div>
        );
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
    const { user } = useUser();
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
        (rowId: string, colId: string, value: any) => {
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
        (colId: string, newOptions: { id: string; label: string; color?: string }[]) => {
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
        columns.forEach(c => { 
            let val: any = "";
            if (c.type === "checkbox") val = false;
            if (c.type === "multi-select") val = [];
            if (c.type === "created-time") val = new Date().toISOString();
            if (c.type === "created-by") val = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Anonymous";
            newRow[c.id] = val; 
        });
        setRows(prev => {
            const next = [...prev, newRow];
            scheduleSave(columns, next);
            return next;
        });
    }, [columns, scheduleSave, user]);

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
            options: ["select", "multi-select", "status"].includes(newColType) ? [] : undefined,
        };
        const nextCols = [...columns, newCol];
        const nextRows = rows.map(r => {
            let initialValue: any = "";
            if (newColType === "checkbox") initialValue = false;
            if (newColType === "multi-select") initialValue = [];
            if (["created-time", "last-edited-time"].includes(newColType)) initialValue = new Date().toISOString();
            
            return { ...r, [newCol.id]: initialValue };
        });
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
            header: () => {
                const colType = col.type;
                const typeInfo = [...COLUMN_TYPES, ...CONNECTION_TYPES].find(t => t.type === colType);
                const Icon = typeInfo?.icon || Type;

                return (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground w-full">
                        <Icon className="h-3 w-3" />
                        {col.name}
                    </span>
                );
            },
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
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 sidebar-scrollbar">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Suggested</p>
                                        <div className="grid grid-cols-1 gap-0.5">
                                            {[
                                                { type: "created-by", label: "Created by", icon: UserCheck },
                                                { type: "email", label: "Contact email", icon: Mail },
                                                { type: "url", label: "Website", icon: Link },
                                                { type: "status", label: "Priority", icon: CheckSquare },
                                            ].map(({ type, label, icon: Icon }) => (
                                                <button
                                                    key={type}
                                                    onClick={() => {
                                                        setNewColType(type as any);
                                                        setNewColName(label);
                                                    }}
                                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors hover:bg-muted text-muted-foreground hover:text-primary ${newColType === type ? "bg-muted text-primary" : ""}`}
                                                >
                                                    <Icon className="h-3.5 w-3.5" />
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Properies</p>
                                        <div className="grid grid-cols-2 gap-1">
                                            {COLUMN_TYPES.map(({ type, label, icon: Icon }) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setNewColType(type)}
                                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors border ${newColType === type ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted text-muted-foreground hover:text-primary"}`}
                                                >
                                                    <Icon className="h-3.5 w-3.5" />
                                                    <span className="truncate">{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Connections</p>
                                        <div className="grid grid-cols-1 gap-0.5">
                                            {CONNECTION_TYPES.map(({ type, label, icon: Icon }) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setNewColType(type)}
                                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors border ${newColType === type ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted text-muted-foreground hover:text-primary"}`}
                                                >
                                                    <Icon className="h-3.5 w-3.5" />
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <Button size="sm" className="w-full h-9 text-xs font-semibold" onClick={addColumn}>
                                    Create Property
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
                                    const allTypes = [...COLUMN_TYPES, ...CONNECTION_TYPES];
                                    const colIcon = allTypes.find(c => c.type === col.type)?.icon ?? Type;
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
