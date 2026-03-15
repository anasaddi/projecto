import React from 'react';
import { motion } from 'framer-motion';

export default function Welcome() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-stone-900 dark:text-stone-100">
            PROJECTO
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm font-medium leading-relaxed">
            Personal Performance & Knowledge Management System.
            <br />
            Private access only.
          </p>
        </div>

        <div className="pt-8 border-t border-stone-200 dark:border-stone-800">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[10px] font-bold uppercase tracking-widest text-stone-400">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-pulse" />
            Waiting for Authentication
          </div>
        </div>
      </motion.div>
    </div>
  );
}
