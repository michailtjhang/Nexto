import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface WorkspaceStore {
    activeWorkspaceId: string | null;
    setActiveWorkspaceId: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
    persist(
        (set) => ({
            activeWorkspaceId: null,
            setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
        }),
        {
            name: "workspace-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
