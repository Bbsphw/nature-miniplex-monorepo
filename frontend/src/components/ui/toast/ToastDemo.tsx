'use client';

import React, { useState } from 'react';
import { toast } from '@/store/useToastStore';
import { ToastContainer } from './ToastContainer';
import { CheckCircle, Undo2, AlertCircle, Info, ShieldAlert, Sparkles } from 'lucide-react';

export const ToastDemo: React.FC = () => {
  const [lastAction, setLastAction] = useState<string>('None');

  const handleStandardSuccess = () => {
    toast.success('File saved successfully!', {
      description: 'Your changes have been synced to the cloud.',
    });
  };

  const handleToastWithUndo = () => {
    const deletedItemId = `item-${Math.floor(Math.random() * 1000)}`;
    setLastAction(`Deleted item #${deletedItemId}`);

    toast.success(`Deleted item #${deletedItemId}`, {
      description: 'The item was removed from your collection.',
      action: {
        label: 'Undo',
        onClick: () => {
          setLastAction(`Restored item #${deletedItemId}`);
          toast.info(`Restored item #${deletedItemId}`, {
            description: 'Action successfully reversed.',
          });
        },
      },
    });
  };

  const handleErrorToast = () => {
    toast.error('Connection failed', {
      description: 'Unable to connect to the database server. Please try again.',
      action: {
        label: 'Retry',
        onClick: () => {
          toast.success('Reconnected to server!');
        },
      },
    });
  };

  const handleWarningToast = () => {
    toast.warning('Storage space running low', {
      description: 'You have used 88% of your allocated quota.',
    });
  };

  const handleInfoToast = () => {
    toast.info('System Update Scheduled', {
      description: 'Maintenance is planned tonight at 02:00 UTC.',
    });
  };

  const handleQueueOverflowTest = () => {
    // Spawns 5 toasts rapidly to demonstrate capping at 3 max visible + queueing
    for (let i = 1; i <= 5; i++) {
      setTimeout(() => {
        toast.info(`Queued Notification #${i}`, {
          description: `Toast ${i} of 5 triggered rapidly.`,
        });
      }, i * 200);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full space-y-8 z-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Next.js + Framer Motion Toast System
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Confirm Toast Notification System
          </h1>
          <p className="text-slate-400 text-base max-w-lg mx-auto">
            Featuring dynamic auto-dismiss duration (extended for Undo), swipe-to-dismiss, pause on hover, slide-up animations, and queue cap of 3 visible toasts.
          </p>
        </div>

        {/* Demo Controls Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleStandardSuccess}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-900/20"
            >
              <CheckCircle className="w-4 h-4" />
              Standard Success (4s)
            </button>

            <button
              onClick={handleToastWithUndo}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-900/20"
            >
              <Undo2 className="w-4 h-4" />
              Success with &apos;Undo&apos; (8s)
            </button>

            <button
              onClick={handleErrorToast}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-medium text-sm transition-all shadow-lg shadow-rose-900/20"
            >
              <AlertCircle className="w-4 h-4" />
              Error with Retry
            </button>

            <button
              onClick={handleWarningToast}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-98 text-white font-medium text-sm transition-all shadow-lg shadow-amber-900/20"
            >
              <ShieldAlert className="w-4 h-4" />
              Warning Toast
            </button>

            <button
              onClick={handleInfoToast}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-98 text-white font-medium text-sm transition-all shadow-lg shadow-sky-900/20 sm:col-span-1"
            >
              <Info className="w-4 h-4" />
              Info Toast
            </button>

            <button
              onClick={handleQueueOverflowTest}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-98 text-slate-200 font-medium text-sm transition-all sm:col-span-1"
            >
              Test Queue (5 Toasts)
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Last state action: <strong className="text-indigo-400">{lastAction}</strong></span>
            <button
              onClick={() => toast.clear()}
              className="text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors"
            >
              Dismiss All
            </button>
          </div>
        </div>
      </div>

      {/* Global Toast Container (Fixed Bottom-Right) */}
      <ToastContainer position="bottom-right" />
    </div>
  );
};
