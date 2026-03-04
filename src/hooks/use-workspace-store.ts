import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface WorkspaceStore {
    activeWorkspaceId: string | null;
    workspaces: any[];
    refreshCounter: number;
    setActiveWorkspaceId: (id: string | null) => void;
    setWorkspaces: (workspaces: any[]) => void;
    triggerRefresh: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
    persist(
        (set) => ({
            activeWorkspaceId: null,
            workspaces: [],
            refreshCounter: 0,
            setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
            setWorkspaces: (workspaces) => set({ workspaces }),
            triggerRefresh: () => set((state) => ({ refreshCounter: state.refreshCounter + 1 })),
        }),
        {
            name: "workspace-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
