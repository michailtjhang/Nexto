"use client";

import Link from "next/link";
import { Coffee } from "lucide-react";

export const Marquee = () => {
    const messages = [
        "Suka dengan Nexto? Yuk, traktir kopi di sini ☕",
        "Dukung perkembangan Nexto agar makin keren! 🚀",
        "Setiap dukungan Anda sangat berarti bagi kami ❤️",
        "Bantu kami menghadirkan fitur-fitur baru ✨",
        "Terima kasih atas dukungan link Traktirnya! 🙏",
    ];

    return (
        <div className="w-full overflow-hidden bg-primary/5 py-3 border-y border-primary/10 flex items-center">
            <div className="flex animate-marquee whitespace-nowrap">
                {/* Duplicate the content to ensure seamless infinite scrolling */}
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center">
                        {messages.map((message, index) => (
                            <div key={index} className="flex items-center px-4 md:px-8 text-sm md:text-base font-medium text-muted-foreground gap-x-2">
                                <Coffee className="h-5 w-5 text-rose-500" />
                                <span>{message}</span>
                                <Link href="https://trakteer.id/michail.kx" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                                    trakteer.id/michail.kx
                                </Link>
                                <span className="text-muted-foreground/50 mx-4">•</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
