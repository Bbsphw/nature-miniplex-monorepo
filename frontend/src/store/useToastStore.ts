import { create } from 'zustand';
import { ToastConfirmOptions, ToastItemData, ToastOptions, ToastType } from '@/types/toast';

const MAX_VISIBLE_TOASTS = 3;
const DEFAULT_DURATION_STANDARD = 4000;
const DEFAULT_DURATION_WITH_ACTION = 8000;
const DEFAULT_DURATION_CONFIRM = 10000; // 10 seconds for confirmation prompts

interface ToastStore {
  toasts: ToastItemData[];
  queue: ToastItemData[];
  addToast: (title: React.ReactNode, type: ToastType, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  queue: [],

  addToast: (title, type, options = {}) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    let defaultDuration = DEFAULT_DURATION_STANDARD;
    if (type === 'confirm') {
      defaultDuration = DEFAULT_DURATION_CONFIRM;
    } else if (options.action) {
      defaultDuration = DEFAULT_DURATION_WITH_ACTION;
    }

    const duration = options.duration ?? defaultDuration;

    const newToast: ToastItemData = {
      id,
      title,
      type,
      duration,
      createdAt: Date.now(),
      ...options,
    };

    set((state) => {
      if (state.toasts.length < MAX_VISIBLE_TOASTS) {
        return { toasts: [newToast, ...state.toasts] };
      } else {
        return { queue: [...state.queue, newToast] };
      }
    });

    return id;
  },

  dismissToast: (id) => {
    set((state) => {
      const targetToast = state.toasts.find((t) => t.id === id);
      if (targetToast?.onDismiss) {
        try {
          targetToast.onDismiss();
        } catch (e) {
          console.error('Error in toast onDismiss handler:', e);
        }
      }

      const filteredToasts = state.toasts.filter((t) => t.id !== id);

      if (state.queue.length > 0 && filteredToasts.length < MAX_VISIBLE_TOASTS) {
        const [nextToast, ...remainingQueue] = state.queue;
        return {
          toasts: [nextToast, ...filteredToasts],
          queue: remainingQueue,
        };
      }

      return { toasts: filteredToasts };
    });
  },

  clearAll: () => set({ toasts: [], queue: [] }),
}));

// Imperative helper API
export const toast = {
  success: (title: React.ReactNode, options?: ToastOptions) =>
    useToastStore.getState().addToast(title, 'success', options),

  error: (title: React.ReactNode, options?: ToastOptions) =>
    useToastStore.getState().addToast(title, 'error', options),

  warning: (title: React.ReactNode, options?: ToastOptions) =>
    useToastStore.getState().addToast(title, 'warning', options),

  info: (title: React.ReactNode, options?: ToastOptions) =>
    useToastStore.getState().addToast(title, 'info', options),

  confirm: (title: React.ReactNode, options: ToastConfirmOptions) => {
    const {
      description,
      duration = DEFAULT_DURATION_CONFIRM,
      confirmText = 'ยืนยัน',
      cancelText = 'ยกเลิก',
      confirmVariant = 'primary',
      onConfirm,
      onCancel,
      icon,
    } = options;

    return useToastStore.getState().addToast(title, 'confirm', {
      description,
      duration,
      icon,
      action: {
        label: confirmText,
        variant: confirmVariant,
        onClick: onConfirm,
      },
      secondaryAction: {
        label: cancelText,
        variant: 'outline',
        onClick: () => {
          onCancel?.();
        },
      },
    });
  },

  dismiss: (id: string) => useToastStore.getState().dismissToast(id),
  clear: () => useToastStore.getState().clearAll(),
};
