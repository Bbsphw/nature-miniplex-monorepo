import { ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
  altText?: string;
  variant?: 'primary' | 'destructive' | 'outline' | 'ghost';
}

export interface ToastOptions {
  description?: ReactNode;
  duration?: number;
  action?: ToastAction;          // Single action (e.g. Undo)
  secondaryAction?: ToastAction; // Secondary action (e.g. Cancel)
  icon?: ReactNode;
  onDismiss?: () => void;
}

export interface ToastConfirmOptions {
  description?: ReactNode;
  duration?: number;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'destructive';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  icon?: ReactNode;
}

export interface ToastItemData extends ToastOptions {
  id: string;
  title: ReactNode;
  type: ToastType;
  createdAt: number;
  duration: number; // resolved duration (ms)
}
