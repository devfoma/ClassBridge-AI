import { create } from 'zustand';
import { LocalClassroom } from '../types/classroom';
import { listClassrooms } from '../db/repositories/classroomRepo';

interface ClassroomState {
  classrooms: LocalClassroom[];
  loading: boolean;
  load: () => Promise<void>;
}

export const useClassroomStore = create<ClassroomState>((set) => ({
  classrooms: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    const classrooms = await listClassrooms();
    set({ classrooms, loading: false });
  },
}));
