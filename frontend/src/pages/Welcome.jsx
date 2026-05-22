import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLogo } from '../components/AppLogo';
import { useThemePreference } from '../hooks/useThemePreference';

export default function Welcome() {
  const { isDark, toggleTheme } = useThemePreference();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#0b0e14] transition-colors duration-500 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-violet-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-md w-full text-center px-6"
      >
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <AppLogo size="lg" className="shadow-2xl shadow-indigo-500/20" />
          </motion.div>

          <div className="space-y-3">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100"
            >
              PROJECTO
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-1"
            >
              <p className="text-zinc-500 dark:text-zinc-400 text-base font-medium">
                Personal Performance & Knowledge Management System.
              </p>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm italic">
                Private access only.
              </p>
            </motion.div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-12 pt-8 border-t border-zinc-200/50 dark:border-white/[0.06]"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.06] shadow-sm text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Waiting for Authentication
          </div>
        </motion.div>
      </motion.div>

      {/* Theme Toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        type="button"
        onClick={toggleTheme}
        className="fixed bottom-8 right-8 flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.1] shadow-xl text-lg hover:scale-110 active:scale-95 transition-all z-50"
      >
        {isDark ? '☀️' : '🌙'}
      </motion.button>

      {/* Footer Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 text-xs text-zinc-400 dark:text-zinc-600 font-medium tracking-tight uppercase"
      >
        v0.1.0 • PROJECTO
      </motion.div>
    </div>
  );
}
