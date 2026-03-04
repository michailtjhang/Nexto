import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface WorkspaceStore {
    activeWorkspaceId: string | null;
    workspaces: any[];
    setActiveWorkspaceId: (id: string | null) => void;
    setWorkspaces: (workspaces: any[]) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
    persist(
        (set) => ({
            activeWorkspaceId: null,
            workspaces: [],
            setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
            setWorkspaces: (workspaces) => set({ workspaces }),
        }),
        {
            name: "workspace-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
