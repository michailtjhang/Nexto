"use client";

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Navigation } from "./_components/navigation";
import { SearchCommand } from "@/components/search-command";

const MainLayout = ({
    children
}: {
    children: React.ReactNode;
}) => {
    const { user, isLoaded } = useUser();

    if (!isLoaded) {
        return (
            <div className="h-full flex items-center justify-center">
                {/* You can add a spinner or skeleton here */}
                Loading...
            </div>
        );
    }

    if (!user) {
        return redirect("/");
    }

    return (
        <div className="h-full flex dark:bg-[#1F1F1F]">
            <Navigation />
            <main className="flex-1 h-full overflow-y-auto">
                <SearchCommand />
                {children}
            </main>
        </div>
    );
}

export default MainLayout;
