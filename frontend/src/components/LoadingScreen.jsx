import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);

  const radius = 52;
  const circumference = 2 * Math.PI * radius; // ~326.726

  useEffect(() => {
    const startTime = performance.now();
    const duration = 1800; // 1.8 seconds

    const updateProgress = (currentTime) => {
      const elapsed = currentTime - startTime;
      const calculated = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(calculated);

      if (elapsed < duration) {
        requestAnimationFrame(updateProgress);
      } else {
        setProgress(100);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 300);
      }
    };

    const animFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animFrame);
  }, [onComplete]);

  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <AnimatePresence>
      <motion.div
        key="loading-screen"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A] text-[#FCFBF9] selection:bg-none"
      >
        {/* Subtle Ambient Background Glow */}
        <div class="absolute w-72 h-72 bg-white/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative flex flex-col items-center">
          {/* Central 120x120 SVG Emblem */}
          <div className="relative w-[120px] h-[120px] flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background Track Circle */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="4"
                fill="transparent"
              />
              {/* Animated Progress Circle */}
              <motion.circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#FCFBF9"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all ease-linear"
              />
            </svg>

            {/* Central Emblem Letter "E" */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-heading font-extrabold text-4xl text-[#FCFBF9] tracking-tight">
                E
              </span>
            </div>
          </div>

          {/* Progress Percentage Counter & Subtitle */}
          <div className="mt-6 text-center space-y-1">
            <div className="font-mono text-sm font-semibold tracking-widest text-neutral-300">
              {progress}%
            </div>
            <p className="text-xs uppercase tracking-[0.05em] font-sans text-neutral-500">
              Loading ExpenseAI Dashboard
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
