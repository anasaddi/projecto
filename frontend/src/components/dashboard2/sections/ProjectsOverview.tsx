import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, MoreHorizontal, Plus, ArrowUpRight, Clock } from 'lucide-react';
import { Card } from '../design/Card';
import { Button } from '../design/Button';
import { Badge } from '../design/Badge';
import { Progress } from '../design/Progress';

interface Project {
  id: string;
  name: string;
  color: string;
  progress: number;
  tasks: { total: number; completed: number };
  dueDate: string;
}

const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Website Redesign', color: 'bg-indigo-500', progress: 75, tasks: { total: 12, completed: 9 }, dueDate: '3 days' },
  { id: '2', name: 'Mobile App', color: 'bg-emerald-500', progress: 45, tasks: { total: 20, completed: 9 }, dueDate: '2 weeks' },
  { id: '3', name: 'Marketing Campaign', color: 'bg-amber-500', progress: 90, tasks: { total: 8, completed: 7 }, dueDate: 'Tomorrow' },
];

const PROJECT_COLORS = [
  { bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-600' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' },
  { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600' },
  { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600' },
  { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600' },
];

export const ProjectsOverview: React.FC = () => {
  const [projects] = useState<Project[]>(MOCK_PROJECTS);
  const [activeProject, setActiveProject] = useState<string | null>(null);

  const totalProgress = Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length);

  return (
    <Card variant="default" size="lg" className="h-full">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <Folder className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Projects</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">Track your progress</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{totalProgress}% avg</Badge>
          <Button variant="ghost" size="icon-sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {projects.map((project, index) => {
            const colorSet = PROJECT_COLORS[index % PROJECT_COLORS.length];
            const isActive = activeProject === project.id;
            
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveProject(isActive ? null : project.id)}
                className={`
                  group p-3 rounded-xl cursor-pointer transition-all border
                  ${isActive 
                    ? 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700' 
                    : 'border-transparent hover:bg-stone-50/50 dark:hover:bg-stone-800/30'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colorSet.bg}`} />
                    <span className="font-medium text-stone-800 dark:text-stone-200 text-sm">{project.name}</span>
                  </div>
                  <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {project.dueDate}
                  </span>
                  <span>{project.tasks.completed}/{project.tasks.total} tasks</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Progress
                      value={project.progress}
                      size="sm"
                      color={project.progress >= 80 ? 'success' : project.progress >= 50 ? 'primary' : 'warning'}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${colorSet.text}`}>{project.progress}%</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Button variant="ghost" size="sm" className="w-full mt-4 text-stone-500 dark:text-stone-400">
        View all projects
        <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
      </Button>
    </Card>
  );
};
