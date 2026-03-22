import { Navbar } from "./_components/navbar";
import { Marquee } from "@/components/marquee";

const MarketingLayout = ({
    children
}: {
    children: React.ReactNode;
}) => {
    return (
        <div className="h-full dark:bg-[#1F1F1F]">
            <div className="fixed top-0 w-full z-50">
                <Navbar />
                <Marquee />
            </div>
            <main className="h-full pt-32 md:pt-40">
                {children}
            </main>
        </div>
    );
}

export default MarketingLayout;
