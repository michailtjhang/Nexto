"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export const Heading = () => {
    const { user, isLoaded } = useUser();

    return (
        <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold">
                Your Ideas, Documents, & Plans. Unified. Welcome to <span className="underline">Nexto</span>
            </h1>
            <h3 className="text-base sm:text-xl md:text-2xl font-medium">
                Nexto is the connected workspace where <br />
                better, faster work happens.
            </h3>
            {isLoaded && !user && (
                <SignInButton mode="modal">
                    <Button>
                        Get Nexto free
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </SignInButton>
            )}
            {isLoaded && user && (
                <Button asChild>
                    <Link href="/documents">
                        Enter Nexto
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                </Button>
            )}
        </div>
    )
}
