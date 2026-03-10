import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "@/components/providers/providers";
import { ModalProvider } from "@/components/providers/modal-provider";
import "./globals.css";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexto — Your connected workspace",
  description:
    "Nexto is a Notion-inspired workspace for notes, documents, databases, and collaboration.",
  keywords: ["Notion clone", "workspace", "notes", "database", "collaboration", "Next.js", "React", "BlockNote", "Tailwind CSS"],
  authors: [{ name: "Michail" }],
  openGraph: {
    title: "Nexto — Your connected workspace",
    description: "Nexto is a Notion-inspired workspace for notes, documents, databases, and collaboration.",
    url: "https://nexto.vercel.app",
    siteName: "Nexto",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Nexto Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexto — Your connected workspace",
    description: "Nexto is a Notion-inspired workspace for notes, documents, databases, and collaboration.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className="h-full">
        <body className={cn(inter.className, "h-full")}>
          <NextSSRPlugin
            /**
             * The `extractRouterConfig` will extract **only** the route configs
             * from the router to prevent additional information from being
             * leaked to the client. The data passed to the client is the same
             * as if you were to fetch `/api/uploadthing` directly.
             */
            routerConfig={extractRouterConfig(ourFileRouter)}
          />
          <Providers>
            <ModalProvider />
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
