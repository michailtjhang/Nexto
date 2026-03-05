import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

const handleAuth = async (req: Request) => {
    const { userId } = await auth();
    if (!userId) throw new UploadThingError("Unauthorized");
    return { userId };
};

export const ourFileRouter = {
    imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(({ req }) => handleAuth(req))
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete for userId:", metadata.userId);
            console.log("file url", file.url);
            return { uploadedBy: metadata.userId };
        }),
    mediaUploader: f({
        image: { maxFileSize: "4MB", maxFileCount: 1 },
        video: { maxFileSize: "16MB", maxFileCount: 1 },
        audio: { maxFileSize: "8MB", maxFileCount: 1 },
        pdf: { maxFileSize: "4MB", maxFileCount: 1 },
        blob: { maxFileSize: "8MB", maxFileCount: 1 },
    })
        .middleware(({ req }) => handleAuth(req))
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete for userId:", metadata.userId);
            console.log("file url", file.url);
            return { uploadedBy: metadata.userId };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
