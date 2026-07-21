import { create } from 'zustand';
import { ReactNode } from 'react';

export interface ConfirmModalOptions {
  title: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'destructive' | 'warning';
  icon?: ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

interface ConfirmStoreState {
  isOpen: boolean;
  options: ConfirmModalOptions | null;
  isLoading: boolean;
  openConfirm: (options: ConfirmModalOptions) => void;
  closeConfirm: () => void;
  setLoading: (loading: boolean) => void;
}

export const useConfirmStore = create<ConfirmStoreState>((set) => ({
  isOpen: false,
  options: null,
  isLoading: false,

  openConfirm: (options) => {
    set({ isOpen: true, options, isLoading: false });
  },

  closeConfirm: () => {
    set({ isOpen: false, options: null, isLoading: false });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },
}));

// Global helper for opening confirm modals imperatively anywhere
export const confirmModal = (options: ConfirmModalOptions) => {
  useConfirmStore.getState().openConfirm(options);
};
