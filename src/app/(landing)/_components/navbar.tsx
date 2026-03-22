"use client";

import { useScrollTop } from "@/hooks/use-scroll-top";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export const Navbar = () => {
    const { user, isLoaded } = useUser();
    const scrolled = useScrollTop();

    return (
        <div className={cn(
            "z-50 bg-background dark:bg-[#1F1F1F] fixed top-0 flex items-center w-full p-6 transition-all",
            scrolled && "border-b shadow-sm"
        )}>
            <Logo />
            <div className="md:ml-auto md:justify-end justify-between w-full flex items-center gap-x-2">
                {!isLoaded && (
                    <p>Loading...</p>
                )}
                {!user && isLoaded && (
                    <>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="https://trakteer.id/michail.kx" target="_blank" rel="noopener noreferrer">
                                Support Donasi
                            </Link>
                        </Button>
                        <SignInButton mode="modal">
                            <Button variant="ghost" size="sm">
                                Log in
                            </Button>
                        </SignInButton>
                        <SignInButton mode="modal">
                            <Button size="sm">
                                Get Nexto free
                            </Button>
                        </SignInButton>
                    </>
                )}
                {user && isLoaded && (
                    <>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="https://trakteer.id/michail.kx" target="_blank" rel="noopener noreferrer">
                                Support Donasi
                            </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/documents">
                                Enter Nexto
                            </Link>
                        </Button>
                        <UserButton afterSignOutUrl="/" />
                    </>
                )}
                <ModeToggle />
            </div>
        </div>
    )
}
