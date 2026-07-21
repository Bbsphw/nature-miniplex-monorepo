'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirmStore } from '@/store/useConfirmStore';
import { AlertCircle, HelpCircle, AlertTriangle, Loader2 } from 'lucide-react';

export const ConfirmModal: React.FC = () => {
  const { isOpen, options, isLoading, closeConfirm, setLoading } = useConfirmStore();

  if (!options) return null;

  const {
    title,
    description,
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก',
    variant = 'primary',
    onConfirm,
    onCancel,
    icon: customIcon,
  } = options;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
    } catch (error) {
      console.error('Confirm modal error:', error);
    } finally {
      closeConfirm();
    }
  };

  const handleCancel = async () => {
    try {
      if (onCancel) {
        await onCancel();
      }
    } catch (error) {
      console.error('Cancel modal error:', error);
    } finally {
      closeConfirm();
    }
  };

  const getVariantIcon = () => {
    if (customIcon) return customIcon;
    switch (variant) {
      case 'destructive':
        return <AlertCircle className="w-7 h-7 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-7 h-7 text-amber-500" />;
      default:
        return <HelpCircle className="w-7 h-7 text-brand-red" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop Overlay with Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Centered Modal Content Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Header Icon Badge */}
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/80 border border-slate-700/60 shadow-inner">
                {getVariantIcon()}
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-white font-prompt">
                  {title}
                </h3>
                {description && (
                  <p className="text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                    {description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full pt-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleCancel}
                  className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 border border-slate-700 py-2.5 text-sm font-medium text-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
                >
                  {cancelText}
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleConfirm}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-98 focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    variant === 'destructive'
                      ? 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500 shadow-rose-950/40'
                      : 'bg-brand-red hover:bg-brand-red-dark focus:ring-brand-red shadow-brand-red/30'
                  }`}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
