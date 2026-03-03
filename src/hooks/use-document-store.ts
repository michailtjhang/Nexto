import { create } from "zustand";

interface DocumentStore {
    id: string | null;
    title: string;
    setId: (id: string | null) => void;
    setTitle: (title: string) => void;
    reset: () => void;
}

export const useDocumentStore = create<DocumentStore>((set) => ({
    id: null,
    title: "",
    setId: (id) => set({ id }),
    setTitle: (title) => set({ title }),
    reset: () => set({ id: null, title: "" }),
}));
