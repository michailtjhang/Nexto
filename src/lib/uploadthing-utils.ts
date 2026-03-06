/**
 * Extracts all UploadThing URLs from BlockNote JSON content.
 * BlockNote 0.47.x structure is an array of blocks.
 * Media blocks (image, video, audio, file) have props.url.
 */
export const extractMediaUrls = (content: any): string[] => {
    if (!content) return [];
    
    let blocks: any[] = [];
    
    try {
        blocks = typeof content === "string" ? JSON.parse(content) : content;
    } catch (e) {
        return [];
    }

    if (!Array.isArray(blocks)) return [];

    const urls: string[] = [];

    const traverse = (items: any[]) => {
        for (const block of items) {
            // Check for media blocks
            if (["image", "video", "audio", "file"].includes(block.type)) {
                if (block.props?.url && typeof block.props.url === "string") {
                    urls.push(block.props.url);
                }
            }
            
            // Traverse children if any
            if (block.children && Array.isArray(block.children)) {
                traverse(block.children);
            }
        }
    };

    traverse(blocks);
    return urls;
};

/**
 * Extracts the fileKey from an UploadThing URL.
 * URL format: https://utfs.io/f/fileKey
 */
export const getFileKeyFromUrl = (url: string): string | null => {
    if (!url.includes("utfs.io/f/")) return null;
    return url.split("/").pop() || null;
};
