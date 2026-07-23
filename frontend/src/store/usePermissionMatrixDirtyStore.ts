import { create } from 'zustand';

interface PermissionMatrixDirtyStore {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
}

export const usePermissionMatrixDirtyStore = create<PermissionMatrixDirtyStore>((set) => ({
  isDirty: false,
  setDirty: (isDirty) => set({ isDirty }),
}));
