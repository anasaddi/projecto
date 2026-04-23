import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ChevronDown, Trophy, Crown, Medal } from 'lucide-react';
import { Card } from '../design/Card';
import { Badge } from '../design/Badge';
import { Progress } from '../design/Progress';

interface LifeGoal {
  id: string;
  tier: 'visionary' | 'longterm' | 'mediumterm';
  title: string;
  progress: number;
  deadline: string;
}

const MOCK_GOALS: LifeGoal[] = [
  { id: '1', tier: 'visionary', title: 'Become a recognized expert in AI', progress: 35, deadline: '5 years' },
  { id: '2', tier: 'longterm', title: 'Complete Masters in CS', progress: 60, deadline: '2 years' },
  { id: '3', tier: 'longterm', title: 'Build passive income stream', progress: 25, deadline: '3 years' },
  { id: '4', tier: 'mediumterm', title: 'Launch SaaS product', progress: 45, deadline: '6 months' },
  { id: '5', tier: 'mediumterm', title: 'Contribute to open source', progress: 70, deadline: '3 months' },
];

const TIER_CONFIG = {
  visionary: { icon: Crown, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20', label: 'Visionary' },
  longterm: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Long Term' },
  mediumterm: { icon: Medal, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Medium Term' },
};

export const LifeGoalsCard: React.FC = () => {
  const [goals] = useState<LifeGoal[]>(MOCK_GOALS);
  const [expandedTier, setExpandedTier] = useState<string | null>('visionary');

  const groupedGoals = goals.reduce((acc, goal) => {
    if (!acc[goal.tier]) acc[goal.tier] = [];
    acc[goal.tier].push(goal);
    return acc;
  }, {} as Record<string, LifeGoal[]>);

  const overallProgress = Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length);

  return (
    <Card variant="default" size="lg" className="h-full">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Life Goals</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">Long-term vision</p>
          </div>
        </div>
        <Badge variant="primary">{overallProgress}%</Badge>
      </div>

      <div className="space-y-2">
        {Object.entries(TIER_CONFIG).map(([tier, config]) => {
          const tierGoals = groupedGoals[tier] || [];
          const isExpanded = expandedTier === tier;
          const Icon = config.icon;
          const tierProgress = tierGoals.length > 0
            ? Math.round(tierGoals.reduce((acc, g) => acc + g.progress, 0) / tierGoals.length)
            : 0;

          return (
            <div key={tier} className="overflow-hidden rounded-xl border border-stone-100 dark:border-stone-800">
              <button
                onClick={() => setExpandedTier(isExpanded ? null : tier)}
                className={`
                  w-full flex items-center justify-between p-3 transition-colors
                  ${config.bg}
                `}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className={`font-medium text-sm ${config.color}`}>{config.label}</span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">({tierGoals.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 dark:text-stone-400">{tierProgress}%</span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  </motion.div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && tierGoals.length > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 space-y-2 bg-white dark:bg-stone-900/50">
                      {tierGoals.map((goal) => (
                        <div key={goal.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-stone-700 dark:text-stone-300">{goal.title}</span>
                            <span className="text-xs text-stone-400 dark:text-stone-500">{goal.deadline}</span>
                          </div>
                          <Progress value={goal.progress} size="sm" showLabel={false} />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
