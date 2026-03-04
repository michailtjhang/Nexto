"use client";

import Image from "next/image";
import { PlusCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";

const TEMPLATES = [
    {
        title: "Project Tracker",
        emoji: "📊",
        icon: "📊",
        description: "Track your tasks and deadlines",
        content: [
            {
                type: "heading",
                props: { textColor: "default", backgroundColor: "default", textAlignment: "left", level: 1 },
                content: [{ type: "text", text: "Project Tracker", styles: {} }],
                children: []
            },
            {
                type: "paragraph",
                props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
                content: [{ type: "text", text: "Use this template to keep track of your team's progress.", styles: {} }],
                children: []
            }
        ]
    },
    {
        title: "Reading List",
        emoji: "📚",
        icon: "📚",
        description: "Organize your favorite books",
        content: [
            {
                type: "heading",
                props: { level: 1 },
                content: [{ type: "text", text: "My Reading List", styles: {} }]
            }
        ]
    },
    {
        title: "Meeting Notes",
        emoji: "📝",
        icon: "📝",
        description: "Never miss a detail in meetings",
        content: [
            {
                type: "heading",
                props: { level: 1 },
                content: [{ type: "text", text: "Meeting Notes", styles: {} }]
            }
        ]
    },
    {
        title: "Personal Wiki",
        emoji: "🏠",
        icon: "🏠",
        description: "A home for your long-term goals",
        content: [
            {
                type: "heading",
                props: { level: 1 },
                content: [{ type: "text", text: "Personal Wiki", styles: {} }]
            }
        ]
    }
];

const DocumentsPage = () => {
    const { user } = useUser();
    const router = useRouter();
    const { activeWorkspaceId, triggerRefresh } = useWorkspaceStore();

    const onCreate = () => {
        if (!activeWorkspaceId) {
            toast.error("Please select a workspace first");
            return;
        }

        const promise = fetch("/api/documents", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: "Untitled",
                workspaceId: activeWorkspaceId
            }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || "Failed to create");
                }
                triggerRefresh();
                return res.json();
            })
            .then((doc) => router.push(`/documents/${doc.id}`));

        toast.promise(promise, {
            loading: "Creating a new note...",
            success: "New note created!",
            error: "Failed to create a new note.",
        });
    };

    const onTemplateCreate = (template: typeof TEMPLATES[0]) => {
        if (!activeWorkspaceId) {
            toast.error("Please select a workspace first");
            return;
        }

        const promise = fetch("/api/documents", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: template.title,
                emoji: template.emoji,
                workspaceId: activeWorkspaceId,
                content: template.content,
            }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || "Failed to create from template");
                }
                triggerRefresh();
                return res.json();
            })
            .then((doc) => router.push(`/documents/${doc.id}`));

        toast.promise(promise, {
            loading: `Creating ${template.title}...`,
            success: `${template.title} ready!`,
            error: "Failed to create template.",
        });
    };

    return (
        <div className="min-h-full flex flex-col items-center p-8 pt-16 md:pt-32 space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col items-center space-y-4 max-w-md text-center">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <Image
                        src="/logo.png"
                        height="240"
                        width="240"
                        alt="Logo"
                        className="relative grayscale-[20%] group-hover:grayscale-0 transition duration-500 w-[180px] h-[180px] md:w-[240px] md:h-[240px] object-contain"
                    />
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        Welcome back, {user?.firstName}
                    </h2>
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-[320px] mx-auto">
                        Your workspace is ready. What would you like to build today?
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                <Button
                    onClick={onCreate}
                    size="lg"
                    className="h-32 flex flex-col items-center justify-center gap-y-2 text-lg font-semibold hover:scale-[1.02] transition active:scale-95 bg-gradient-to-br from-indigo-600 to-blue-700 border-none shadow-lg shadow-blue-500/20"
                >
                    <PlusCircle className="h-8 w-8 mb-1" />
                    Create a new note
                </Button>

                <div className="h-32 p-6 rounded-xl border border-dashed border-primary/20 flex flex-col items-center justify-center text-center group hover:border-primary/40 transition">
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition">
                        Quick Tip: Use ⌘+K to search across all your documents instantly.
                    </p>
                </div>
            </div>

            <div className="w-full max-w-2xl pt-8 border-t border-primary/5">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Recommended Templates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-10">
                    {TEMPLATES.map((template) => (
                        <div
                            key={template.title}
                            onClick={() => onTemplateCreate(template)}
                            className="group relative flex flex-col gap-y-2 p-4 rounded-xl border border-primary/5 bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition hover:scale-[1.02] active:scale-95"
                        >
                            <div className="text-3xl mb-1">{template.icon}</div>
                            <h4 className="font-semibold text-sm">{template.title}</h4>
                            <p className="text-[10px] text-muted-foreground leading-tight">
                                {template.description}
                            </p>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                                <PlusCircle className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DocumentsPage;
