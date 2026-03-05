import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

const handleAuth = async () => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    return { userId };
};

export const ourFileRouter = {
    imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(() => handleAuth())
        .onUploadComplete(() => { }),
    mediaUploader: f({
        image: { maxFileSize: "4MB", maxFileCount: 1 },
        video: { maxFileSize: "16MB", maxFileCount: 1 },
        audio: { maxFileSize: "8MB", maxFileCount: 1 },
        pdf: { maxFileSize: "4MB", maxFileCount: 1 },
        blob: { maxFileSize: "8MB", maxFileCount: 1 },
    })
        .middleware(() => handleAuth())
        .onUploadComplete(() => { }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
