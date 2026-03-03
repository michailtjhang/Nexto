"use client";

import Image from "next/image";
import { PlusCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const DocumentsPage = () => {
    const { user } = useUser();
    const router = useRouter();

    const onCreate = () => {
        const promise = fetch("/api/documents", {
            method: "POST",
            body: JSON.stringify({ title: "Untitled" }),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to create");
                return res.json();
            })
            .then((doc) => router.push(`/documents/${doc.id}`));

        toast.promise(promise, {
            loading: "Creating a new note...",
            success: "New note created!",
            error: "Failed to create a new note.",
        });
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-8 pt-20 space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col items-center space-y-4 max-w-md text-center">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <Image
                        src="/logo.png"
                        height="240"
                        width="240"
                        alt="Logo"
                        className="relative grayscale-[20%] group-hover:grayscale-0 transition duration-500"
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
                    Workspace Overview
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-10">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-square rounded-xl bg-secondary/30 animate-pulse border border-primary/5" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DocumentsPage;
