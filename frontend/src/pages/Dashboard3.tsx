import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, Target, Sparkles, Play, Pause, RotateCcw, Check, Plus, TrendingUp, Clock, Calendar, Star, Activity, Layers } from 'lucide-react';

// Mock Data
const INITIAL_TOP3 = [
  { id: '1', text: 'Complete project review', done: false },
  { id: '2', text: 'Team meeting at 2pm', done: false },
  { id: '3', text: 'Review pull requests', done: true },
];

const HABITS = [
  { id: '1', name: 'Meditation', streak: 12, done: true, icon: '🧘' },
  { id: '2', name: 'Reading', streak: 5, done: false, icon: '📚' },
  { id: '3', name: 'Water', streak: 8, done: true, icon: '💧' },
  { id: '4', name: 'Exercise', streak: 3, done: false, icon: '💪' },
];

const PROJECTS = [
  { name: 'Website', progress: 75, color: 'from-violet-500 to-purple-500' },
  { name: 'Mobile App', progress: 45, color: 'from-emerald-500 to-teal-500' },
  { name: 'Marketing', progress: 90, color: 'from-amber-500 to-orange-500' },
];

// Glass Card Component
const GlassCard: React.FC<{ children: React.ReactNode; className?: string; delay?: number; colSpan?: string }> = ({ 
  children, className = '', delay = 0, colSpan = '' 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    className={`relative overflow-hidden rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/20 ${colSpan} ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
    <div className="relative z-10 p-6 h-full">{children}</div>
  </motion.div>
);

// Pomodoro Card
function PomodoroCard() {
  const [time, setTime] = useState(25 * 60);
  const [active, setActive] = useState(false);
  
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [active]);
  
  const mins = Math.floor(time / 60).toString().padStart(2, '0');
  const secs = (time % 60).toString().padStart(2, '0');
  const progress = ((25 * 60 - time) / (25 * 60)) * 100;
  
  return (
    <GlassCard delay={0.1} className="row-span-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
          <Flame className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Focus Time</h3>
          <p className="text-white/40 text-xs">25 min sessions</p>
        </div>
        <span className="ml-auto text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300">5 day streak</span>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48 mb-6">
          <svg className="w-full h-full -rotate-90">
            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="none" className="text-white/5" />
            <circle cx="96" cy="96" r="88" stroke="url(#grad)" strokeWidth="8" fill="none" 
              strokeDasharray={`${progress * 5.53} 553`} strokeLinecap="round" className="transition-all duration-500" />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-white tracking-tight">{mins}:{secs}</span>
            <span className="text-white/40 text-sm mt-1">Ready to focus</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => setActive(!active)} 
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform">
            {active ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
          </button>
          <button onClick={() => { setTime(25 * 60); setActive(false); }}
            className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <RotateCcw className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

// Top 3 Priorities
function Top3Card() {
  const [tasks, setTasks] = useState(INITIAL_TOP3);
  const toggle = (id: string) => setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  
  return (
    <GlassCard delay={0.2}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center">
          <Target className="w-5 h-5 text-indigo-400" />
        </div>
        <h3 className="text-white font-semibold">Top 3 Priorities</h3>
        <span className="ml-auto text-xs px-2 py-1 rounded-full bg-white/5 text-white/40">{tasks.filter(t => t.done).length}/3</span>
      </div>
      
      <div className="space-y-3">
        {tasks.map((task, i) => (
          <motion.div key={task.id} onClick={() => toggle(task.id)}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer group transition-colors">
            <div className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all ${
              task.done ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-white/10 group-hover:bg-white/20'
            }`}>
              {task.done && <Check className="w-4 h-4 text-white" />}
            </div>
            <span className={`flex-1 text-sm ${task.done ? 'text-white/30 line-through' : 'text-white'}`}>{task.text}</span>
            <span className="text-xs text-white/20">0{i + 1}</span>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

// Habits Grid
function HabitsCard() {
  return (
    <GlassCard delay={0.3} className="row-span-2">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Daily Habits</h3>
          <p className="text-white/40 text-xs">Build consistency</p>
        </div>
        <button className="ml-auto w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10">
          <Plus className="w-4 h-4 text-white/60" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {HABITS.map((h) => (
          <motion.div key={h.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-2xl cursor-pointer transition-all ${h.done ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/[0.03] border border-white/5'}`}>
            <div className="text-2xl mb-2">{h.icon}</div>
            <p className={`text-sm font-medium ${h.done ? 'text-emerald-300' : 'text-white'}`}>{h.name}</p>
            <div className="flex items-center gap-1 mt-2">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-white/40">{h.streak} days</span>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-emerald-300">Today Progress</span>
          <span className="text-sm font-semibold text-white">50%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
        </div>
      </div>
    </GlassCard>
  );
}

// Stats Row
function StatsRow() {
  const stats = [
    { label: 'Tasks Done', value: '24', change: '+12%', icon: <Check className="w-4 h-4" />, color: 'from-emerald-500 to-teal-500' },
    { label: 'Focus Time', value: '4.5h', change: '+0.5h', icon: <Clock className="w-4 h-4" />, color: 'from-indigo-500 to-violet-500' },
    { label: 'Streak', value: '7 days', change: '+1', icon: <Flame className="w-4 h-4" />, color: 'from-orange-500 to-red-500' },
    { label: 'Productivity', value: '89%', change: '+5%', icon: <TrendingUp className="w-4 h-4" />, color: 'from-amber-500 to-orange-500' },
  ];
  
  return (
    <GlassCard delay={0.25}>
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className={`w-10 h-10 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${s.color}/20 flex items-center justify-center text-white`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/40 mb-1">{s.label}</p>
            <span className="text-xs text-emerald-400">{s.change}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// Projects Overview
function ProjectsCard() {
  return (
    <GlassCard delay={0.35}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
          <Layers className="w-5 h-5 text-violet-400" />
        </div>
        <h3 className="text-white font-semibold">Projects</h3>
        <span className="ml-auto text-xs text-white/40">70% avg</span>
      </div>
      
      <div className="space-y-4">
        {PROJECTS.map((p) => (
          <div key={p.name} className="group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white">{p.name}</span>
              <span className="text-sm font-medium text-white/60">{p.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} transition={{ duration: 1, delay: 0.5 }}
                className={`h-full rounded-full bg-gradient-to-r ${p.color}`} />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// Life Goals
function GoalsCard() {
  const goals = [
    { tier: 'Visionary', title: 'AI Expert', progress: 35, years: '5 years', color: 'from-violet-500 to-purple-500' },
    { tier: 'Long Term', title: 'Build Startup', progress: 42, years: '3 years', color: 'from-amber-500 to-orange-500' },
    { tier: 'Medium Term', title: 'Full Stack Pro', progress: 58, years: '1 year', color: 'from-emerald-500 to-teal-500' },
  ];
  
  return (
    <GlassCard delay={0.4}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>
        <h3 className="text-white font-semibold">Life Goals</h3>
      </div>
      
      <div className="space-y-3">
        {goals.map((g) => (
          <div key={g.title} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium bg-gradient-to-r ${g.color} bg-clip-text text-transparent`}>{g.tier}</span>
              <span className="text-xs text-white/30">{g.years}</span>
            </div>
            <p className="text-sm text-white mb-2">{g.title}</p>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${g.color}`} style={{ width: `${g.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// Quick Tasks
function QuickTasksCard() {
  const [tasks, setTasks] = useState([
    { id: '1', text: 'Review design mockups', done: false },
    { id: '2', text: 'Update documentation', done: false },
    { id: '3', text: 'Reply to client', done: true },
  ]);
  const [input, setInput] = useState('');
  
  const addTask = () => {
    if (!input.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: input, done: false }]);
    setInput('');
  };
  
  return (
    <GlassCard delay={0.45}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
          <Star className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-white font-semibold">Quick Tasks</h3>
        <span className="ml-auto text-xs text-white/40">{tasks.filter(t => !t.done).length} remaining</span>
      </div>
      
      <div className="flex gap-2 mb-4">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Add a task..."
          className="flex-1 bg-white/5 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:bg-white/10 transition-colors" />
        <button onClick={addTask} className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>
      
      <div className="space-y-2">
        {tasks.filter(t => !t.done).map(t => (
          <motion.div key={t.id} layout className="flex items-center gap-2 group">
            <button onClick={() => setTasks(tasks.map(x => x.id === t.id ? { ...x, done: true } : x))}
              className="w-5 h-5 rounded-lg border border-white/20 flex items-center justify-center group-hover:border-indigo-500/50 transition-colors">
              <Check className="w-3 h-3 text-white/0 group-hover:text-white/50" />
            </button>
            <span className="text-sm text-white/70">{t.text}</span>
          </motion.div>
        ))}
        {tasks.filter(t => t.done).length > 0 && (
          <div className="pt-2 border-t border-white/5">
            <p className="text-xs text-white/30 mb-2">Completed</p>
            {tasks.filter(t => t.done).map(t => (
              <div key={t.id} className="flex items-center gap-2 opacity-50">
                <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-sm text-white/40 line-through">{t.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// Prayer Times
function PrayerCard() {
  const prayers = [
    { name: 'Fajr', time: '05:30', done: true },
    { name: 'Dhuhr', time: '12:30', done: true },
    { name: 'Asr', time: '15:30', done: false },
    { name: 'Maghrib', time: '18:45', done: false },
    { name: 'Isha', time: '21:00', done: false },
  ];
  
  return (
    <GlassCard delay={0.5}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-cyan-400" />
        </div>
        <h3 className="text-white font-semibold">Prayers</h3>
        <span className="ml-auto text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300">Next: 15:30</span>
      </div>
      
      <div className="space-y-2">
        {prayers.map((p) => (
          <div key={p.name} className={`flex items-center justify-between p-2 rounded-xl ${p.done ? 'bg-white/[0.02]' : 'bg-cyan-500/5'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${p.done ? 'bg-emerald-500' : p.name === 'Asr' ? 'bg-cyan-400 animate-pulse' : 'bg-white/20'}`} />
              <span className={`text-sm ${p.done ? 'text-white/40' : 'text-white'}`}>{p.name}</span>
            </div>
            <span className={`text-xs ${p.done ? 'text-white/30' : 'text-cyan-300'}`}>{p.time}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
        <div className="flex items-center justify-between">
          <span className="text-sm text-cyan-300">Daily Progress</span>
          <span className="text-sm font-bold text-white">40%</span>
        </div>
        <div className="h-1.5 mt-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
        </div>
      </div>
    </GlassCard>
  );
}

// Main Dashboard
export default function Dashboard3(): React.ReactElement {
  const [greeting, setGreeting] = useState('');
  const [date, setDate] = useState('');
  
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
    setDate(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950 p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[128px]" />
      </div>
      
      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient-hero">{greeting}, Anas</h1>
            <p className="text-white/40 mt-1">{date}</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-300">All systems operational</span>
          </div>
        </motion.header>
        
        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Row 1 */}
          <PomodoroCard />
          <div className="space-y-5">
            <Top3Card />
            <StatsRow />
          </div>
          <HabitsCard />
          <div className="space-y-5">
            <PrayerCard />
            <ProjectsCard />
          </div>
          
          {/* Row 2 */}
          <GoalsCard />
          <QuickTasksCard />
        </div>
        
        {/* Footer */}
        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="mt-12 text-center text-white/20 text-sm">
          Dashboard 3.0 — Built for excellence
        </motion.footer>
      </div>
    </div>
  );
}

