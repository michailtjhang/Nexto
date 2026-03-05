"use client";

import { useUser } from "@clerk/nextjs";
import {
    Dialog,
    DialogContent,
    DialogHeader
} from "@/components/ui/dialog";
import { useSettings } from "@/hooks/use-settings";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/mode-toggle";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, User as UserIcon, ShieldCheck, Trash } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const SettingsModal = () => {
    const { user } = useUser();
    const settings = useSettings();
    const { activeWorkspaceId, workspaces } = useWorkspaceStore();
    const [email, setEmail] = useState("");
    const [members, setMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (settings.isOpen && activeWorkspaceId) {
            fetch(`/api/workspaces/members?workspaceId=${activeWorkspaceId}`)
                .then(res => res.json())
                .then(setMembers);
        }
    }, [settings.isOpen, activeWorkspaceId]);

    const activeWorkspace = workspaces.find(ws => ws.id === activeWorkspaceId);
    const isOwner = activeWorkspace?.userId === user?.id;
    const currentUserMember = members.find(m => m.userId === user?.id);

    const onRemoveMember = async (memberId: string) => {
        const confirm = window.confirm("Are you sure you want to remove this member?");
        if (!confirm) return;

        try {
            setIsLoading(true);
            const res = await fetch(`/api/workspaces/members?memberId=${memberId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to remove member");

            toast.success("Member removed");
            setMembers((prev) => prev.filter((m) => m.id !== memberId));
        } catch (error) {
            toast.error("Failed to remove member");
        } finally {
            setIsLoading(false);
        }
    };

    const onInvite = async () => {
        if (!email) {
            toast.error("Please enter an email address.");
            return;
        }

        if (!activeWorkspaceId) {
            toast.error("Please select a workspace first.");
            return;
        }

        try {
            setIsLoading(true);

            const res = await fetch("/api/workspaces/members", {
                method: "POST",
                body: JSON.stringify({ email, workspaceId: activeWorkspaceId })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to invite member.");
            }

            toast.success("Invitation sent successfully!");
            const newMember = await res.json();
            setMembers((prev) => [...prev, newMember]);
            setEmail("");
        } catch (error: any) {
            toast.error(error.message || "Failed to invite member.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={settings.isOpen} onOpenChange={settings.onClose}>
            <DialogContent>
                <DialogHeader className="border-b pb-3">
                    <h2 className="text-lg font-medium">
                        My settings
                    </h2>
                </DialogHeader>
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-y-1">
                        <Label>Appearance</Label>
                        <span className="text-[0.8rem] text-muted-foreground">
                            Customize how Nexto looks on your device
                        </span>
                    </div>
                    <ModeToggle />
                </div>
                <Separator />
                <div className="space-y-4">
                    <div className="flex flex-col gap-y-1">
                        <Label>Team Members</Label>
                        <span className="text-[0.8rem] text-muted-foreground">
                            {activeWorkspace?.isPersonal
                                ? "This is a personal workspace. Only you can access it."
                                : isOwner
                                    ? "Invite people to this workspace by email"
                                    : "View members of this workspace"
                            }
                        </span>
                    </div>
                    {/* Only show invite input if owner and NOT a personal workspace */}
                    {isOwner && !activeWorkspace?.isPersonal && (
                        <div className="flex gap-x-2">
                            <Input
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                            <Button
                                onClick={onInvite}
                                disabled={isLoading || !email}
                                size="sm"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Invite
                            </Button>
                        </div>
                    )}
                    <div className="max-h-[200px] overflow-y-auto space-y-2">
                        {members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-2 border rounded-md">
                                <div className="flex items-center gap-x-2">
                                    <div className="bg-secondary p-1 rounded-full">
                                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <span className="text-sm truncate max-w-[150px]">
                                        {member.email}
                                    </span>
                                </div>
                                <div className="flex items-center gap-x-2">
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-x-1 text-[0.7rem] text-muted-foreground uppercase font-bold">
                                            <ShieldCheck className="h-3 w-3" />
                                            {member.role}
                                        </div>
                                    </div>
                                    {/* Only owner can remove others, OR user can remove themselves (except if they are the owner) */}
                                    {((isOwner && member.role !== "owner") || (!isOwner && member.userId === user?.id)) && (
                                        <Button
                                            onClick={() => onRemoveMember(member.id)}
                                            disabled={isLoading}
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-neutral-100 transition"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
