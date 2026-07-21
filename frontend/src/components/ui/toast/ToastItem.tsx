'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  X,
  RotateCcw,
} from 'lucide-react';
import { ToastItemData } from '@/types/toast';

interface ToastItemProps {
  toast: ToastItemData;
  onDismiss: (id: string) => void;
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    progressBg: 'bg-emerald-500',
    accentBorder: 'border-l-4 border-l-emerald-500',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-rose-500',
    progressBg: 'bg-rose-500',
    accentBorder: 'border-l-4 border-l-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    progressBg: 'bg-amber-500',
    accentBorder: 'border-l-4 border-l-amber-500',
  },
  info: {
    icon: Info,
    iconColor: 'text-sky-500',
    progressBg: 'bg-sky-500',
    accentBorder: 'border-l-4 border-l-sky-500',
  },
  confirm: {
    icon: HelpCircle,
    iconColor: 'text-brand-red',
    progressBg: 'bg-brand-red',
    accentBorder: 'border-l-4 border-l-brand-red',
  },
};

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const {
    id,
    title,
    description,
    type,
    duration,
    action,
    secondaryAction,
    icon: customIcon,
  } = toast;

  const config = statusConfig[type] || statusConfig.info;
  const IconComponent = config.icon;

  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const [initialStartTime] = useState(() => Date.now());
  const startTimeRef = useRef<number>(initialStartTime);
  const remainingTimeRef = useRef<number>(duration);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Swipe setup with Framer Motion
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);

  // Pause timer on hover
  useEffect(() => {
    if (duration === Infinity) return;

    if (!isPaused) {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => onDismiss(id), remainingTimeRef.current);

      const updateProgress = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const currentRemaining = remainingTimeRef.current - elapsed;
        const pct = Math.max(0, (currentRemaining / duration) * 100);
        setProgress(pct);

        if (currentRemaining > 0) {
          animFrameRef.current = requestAnimationFrame(updateProgress);
        }
      };

      animFrameRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [id, duration, isPaused, onDismiss]);

  const handleActionClick = async () => {
    if (action?.onClick) await action.onClick();
    onDismiss(id);
  };

  const handleSecondaryActionClick = async () => {
    if (secondaryAction?.onClick) await secondaryAction.onClick();
    onDismiss(id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 35, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      style={{ x, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.5, right: 0.5 }}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 500) {
          onDismiss(id);
        }
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-xl backdrop-blur-md transition-shadow hover:shadow-2xl ${config.accentBorder}`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 pt-0.5">
          {customIcon ? customIcon : <IconComponent className={`h-5 w-5 ${config.iconColor}`} />}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
            {title}
          </div>
          {description && (
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {description}
            </div>
          )}

          {/* Action / Confirm Buttons */}
          {(action || secondaryAction) && (
            <div className="pt-2.5 flex items-center gap-2 flex-wrap">
              {action && (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                    action.variant === 'destructive'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-900/30'
                      : 'bg-brand-red hover:bg-brand-red/90 text-white shadow-sm shadow-brand-red/30'
                  }`}
                >
                  {action.label.toLowerCase().includes('undo') && (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                  {action.label}
                </button>
              )}

              {secondaryAction && (
                <button
                  type="button"
                  onClick={handleSecondaryActionClick}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  {secondaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {duration !== Infinity && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full ${config.progressBg} transition-all ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};
