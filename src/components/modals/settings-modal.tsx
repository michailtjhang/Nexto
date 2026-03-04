"use client";

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
import { UserPlus, User as UserIcon, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const SettingsModal = () => {
    const settings = useSettings();
    const { activeWorkspaceId } = useWorkspaceStore();
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

    const onInvite = async () => {
        if (!email || !activeWorkspaceId) return;
        setIsLoading(true);

        const res = await fetch("/api/workspaces/members", {
            method: "POST",
            body: JSON.stringify({ email, workspaceId: activeWorkspaceId })
        });

        setIsLoading(false);
        if (res.ok) {
            toast.success("Invitation sent!");
            const newMember = await res.json();
            setMembers((prev) => [...prev, newMember]);
            setEmail("");
        } else {
            toast.error("Failed to invite member.");
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
                            Invite people to this workspace by email
                        </span>
                    </div>
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
                                <div className="flex items-center gap-x-1 text-[0.7rem] text-muted-foreground">
                                    <ShieldCheck className="h-3 w-3" />
                                    {member.role}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
