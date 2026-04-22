import { create } from "zustand";
import type { Subject } from "@/types/subject";

interface SubjectState {
  subjects: Subject[];
  selectedSubjectId: string | null;
  isLoading: boolean;

  // Actions
  setSubjects: (subjects: Subject[]) => void;
  setSelectedSubject: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  getSelectedSubject: () => Subject | null;
}

export const useSubjectStore = create<SubjectState>((set, get) => ({
  subjects: [],
  selectedSubjectId: null,
  isLoading: false,

  setSubjects: (subjects) => set({ subjects }),

  setSelectedSubject: (id) => set({ selectedSubjectId: id }),

  setLoading: (isLoading) => set({ isLoading }),

  getSelectedSubject: () => {
    const { subjects, selectedSubjectId } = get();
    return subjects.find((s) => s.id === selectedSubjectId) ?? null;
  },
}));
