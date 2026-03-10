"use client";

import Image from "next/image";
import { PlusCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";

const mk = (text: string, styles: object = {}) => ({ type: "text", text, styles });
const para = (...texts: string[]) => ({
    type: "paragraph",
    props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
    content: texts.map(t => mk(t)),
    children: [],
});
const h = (level: 1 | 2 | 3, text: string) => ({
    type: "heading",
    props: { level, textColor: "default", backgroundColor: "default", textAlignment: "left" },
    content: [mk(text)],
    children: [],
});
const bullet = (text: string) => ({
    type: "bulletListItem",
    props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
    content: [mk(text)],
    children: [],
});
const check = (text: string, checked = false) => ({
    type: "checkListItem",
    props: { isChecked: checked, textColor: "default", backgroundColor: "default", textAlignment: "left" },
    content: [mk(text)],
    children: [],
});

const TEMPLATES = [
    {
        title: "Project Tracker",
        emoji: "🚀",
        icon: "🚀",
        description: "Plan tasks, track progress, and hit deadlines",
        content: [
            h(1, "Project Tracker"),
            para("Use this page to plan, track, and manage your project."),
            h(2, "Goals"),
            bullet("Goal 1: Define the project scope"),
            bullet("Goal 2: Complete the first milestone"),
            bullet("Goal 3: Ship to production"),
            h(2, "Timeline"),
            para("Week 1 — Research & Planning"),
            para("Week 2 — Design & Development"),
            para("Week 3 — Testing & Review"),
            para("Week 4 — Launch 🎉"),
            h(2, "Tasks"),
            check("Set up project repository"),
            check("Write technical specs"),
            check("Build core features"),
            check("Write tests"),
            check("Deploy to staging"),
        ],
    },
    {
        title: "Reading List",
        emoji: "📚",
        icon: "📚",
        description: "Track books, articles, and podcasts",
        content: [
            h(1, "Reading List"),
            para("Keep track of everything you want to read, watch, or listen to."),
            h(2, "📖 To Read"),
            check("Atomic Habits — James Clear"),
            check("The Great Gatsby — F. Scott Fitzgerald"),
            check("Deep Work — Cal Newport"),
            h(2, "▶️ Now Reading"),
            para("Write your current read here..."),
            h(2, "✅ Finished"),
            check("The Pragmatic Programmer", true),
            check("Clean Code", true),
        ],
    },
    {
        title: "Meeting Notes",
        emoji: "📝",
        icon: "📝",
        description: "Never lose track of decisions and action items",
        content: [
            h(1, "Meeting Notes"),
            para(`Date: ${new Date().toLocaleDateString()}`),
            para("Attendees: "),
            h(2, "Agenda"),
            bullet("Topic 1"),
            bullet("Topic 2"),
            bullet("Topic 3"),
            h(2, "Discussion Notes"),
            para("Write your notes here..."),
            h(2, "Decisions Made"),
            bullet("Decision 1"),
            h(2, "Action Items"),
            check("Action item 1 (Owner)"),
            check("Action item 2 (Owner)"),
        ],
    },
    {
        title: "Personal Home",
        emoji: "🏠",
        icon: "🏠",
        description: "Your personal hub for goals and quick links",
        content: [
            h(1, "Personal Home"),
            para("Welcome to your personal space. Keep everything organized here."),
            h(2, "🎯 Goals"),
            check("Goal 1"),
            check("Goal 2"),
            check("Goal 3"),
            h(2, "⚡ Quick Notes"),
            para("Write your quick thoughts here..."),
            h(2, "📌 Important Links"),
            bullet("Link 1"),
            bullet("Link 2"),
            h(2, "📅 This Week"),
            bullet("Monday: "),
            bullet("Wednesday: "),
            bullet("Friday: "),
        ],
    },
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
                content: JSON.stringify(template.content),
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

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

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
                        {greeting}, {user?.firstName}!
                    </h2>
                    <p className="text-muted-foreground text-base leading-relaxed max-w-[320px] mx-auto">
                        A new page is a chance to think, write, and create. What will you start today?
                    </p>
                </div>
            </div>

            <div className="w-full max-w-2xl">
                <Button
                    onClick={onCreate}
                    size="lg"
                    className="w-full h-14 flex items-center justify-center gap-x-2 text-base font-semibold hover:scale-[1.01] transition active:scale-95 bg-gradient-to-br from-indigo-600 to-blue-700 border-none shadow-lg shadow-blue-500/20"
                >
                    <PlusCircle className="h-5 w-5" />
                    New page
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                    Press <kbd className="px-1.5 py-0.5 text-[11px] rounded border bg-muted font-mono">⌘ K</kbd> to quickly search across all your pages
                </p>
            </div>

            <div className="w-full max-w-2xl pt-6 border-t border-primary/5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Start with a template
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-10">
                    {TEMPLATES.map((template) => (
                        <div
                            key={template.title}
                            onClick={() => onTemplateCreate(template)}
                            className="group relative flex flex-col gap-y-2 p-4 rounded-xl border border-primary/5 bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-all duration-150 hover:scale-[1.02] active:scale-95 hover:shadow-md"
                        >
                            <div className="text-2xl mb-1">{template.icon}</div>
                            <h4 className="font-semibold text-sm leading-tight">{template.title}</h4>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                                {template.description}
                            </p>
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
                                <PlusCircle className="h-3.5 w-3.5 text-primary" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DocumentsPage;
