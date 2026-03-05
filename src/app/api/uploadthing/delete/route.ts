import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { fileKey } = await req.json();

        if (!fileKey) {
            return new NextResponse("File key is required", { status: 400 });
        }

        await utapi.deleteFiles(fileKey);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[UPLOADTHING_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
