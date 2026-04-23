import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, CheckCircle2, Timer } from 'lucide-react';
import { Card } from '../design/Card';
import { Badge } from '../design/Badge';

interface StatItem {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: string;
}

const STATS: StatItem[] = [
  { label: 'Tasks Done', value: '24', change: '+12%', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-500' },
  { label: 'Focus Time', value: '4.5h', change: '+0.5h', icon: <Timer className="w-4 h-4" />, color: 'text-indigo-500' },
  { label: 'Streak', value: '7 days', change: 'Best!', icon: <Calendar className="w-4 h-4" />, color: 'text-amber-500' },
  { label: 'Productivity', value: '89%', change: '+5%', icon: <TrendingUp className="w-4 h-4" />, color: 'text-violet-500' },
];

export const StatsMiniCard: React.FC = () => {
  return (
    <Card variant="glass" size="md" className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Today's Stats</h2>
        <Badge variant="outline" size="sm">Live</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {STATS.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50"
          >
            <div className={`${stat.color} mb-2`}>{stat.icon}</div>
            <p className="text-lg font-bold text-stone-900 dark:text-stone-100">{stat.value}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">{stat.label}</p>
            <p className="text-xs text-emerald-500 mt-1">{stat.change}</p>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
