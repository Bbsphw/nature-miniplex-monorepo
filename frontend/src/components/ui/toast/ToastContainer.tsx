'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/store/useToastStore';
import { ToastItem } from './ToastItem';

interface ToastContainerProps {
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
}

const positionClasses = {
  'bottom-right': 'bottom-6 right-6 items-end',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2 items-center',
  'bottom-left': 'bottom-6 left-6 items-start',
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'bottom-right',
}) => {
  const { toasts, dismissToast } = useToastStore();

  return (
    <div
      tabIndex={-1}
      aria-live="polite"
      aria-atomic="true"
      className={`fixed z-[9999] pointer-events-none flex flex-col gap-3 w-full max-w-sm px-4 sm:px-0 ${positionClasses[position]}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
