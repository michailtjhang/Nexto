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
        <div className="h-full flex flex-col items-center justify-center space-y-4">
            <Image
                src="/empty.png"
                height="300"
                width="300"
                alt="Empty"
                className="dark:hidden"
            />
            <Image
                src="/empty-dark.png"
                height="300"
                width="300"
                alt="Empty"
                className="hidden dark:block"
            />
            <h2 className="text-lg font-medium">
                Welcome to {user?.firstName}&apos;s Nexto
            </h2>
            <Button onClick={onCreate}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create a note
            </Button>
        </div>
    );
}

export default DocumentsPage;
