import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToastNotification({ toasts }) {
  const borderColors = {
    success: 'border-emerald-500/40 text-emerald-300',
    error: 'border-rose-500/40 text-rose-300',
    warning: 'border-amber-500/40 text-amber-300',
    info: 'border-white/20 text-[#FCFBF9]'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className={`px-4 py-2.5 rounded-lg bg-[#121212] border ${
              borderColors[toast.type] || borderColors.info
            } shadow-2xl text-xs font-medium flex items-center gap-2 font-sans pointer-events-auto`}
          >
            <span>{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
