import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FocusCard, 
  Top3Priority, 
  HabitsCard, 
  ProjectsOverview, 
  QuickTasksCard,
  TimelineWidget,
  LifeGoalsCard,
  StatsMiniCard,
  PrayerCountdownsCard
} from '../components/dashboard2/sections';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Dashboard2(): React.ReactElement {
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    let greet = 'Good morning';
    if (hour >= 12) greet = 'Good afternoon';
    if (hour >= 18) greet = 'Good evening';
    setGreeting(greet);

    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    setCurrentDate(date);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 px-6 py-4 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-b border-stone-100 dark:border-stone-800"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {greeting}, Anas
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">{currentDate}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All systems operational
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-min"
        >
          {/* Hero Section - Focus + Top 3 */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <FocusCard />
          </motion.div>
          
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Top3Priority />
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-1">
            <StatsMiniCard />
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-1">
            <PrayerCountdownsCard />
          </motion.div>

          {/* Timeline - Large Card */}
          <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2">
            <TimelineWidget />
          </motion.div>

          {/* Habits */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <HabitsCard />
          </motion.div>

          {/* Quick Tasks */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <QuickTasksCard />
          </motion.div>

          {/* Projects - Wide Card */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <ProjectsOverview />
          </motion.div>

          {/* Life Goals */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <LifeGoalsCard />
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-stone-400 dark:text-stone-500">
        <p>Dashboard2 — Modern Productivity Interface</p>
      </footer>
    </div>
  );
}
