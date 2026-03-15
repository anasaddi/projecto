import React from 'react';
import { Icons } from './Icons';
import { LifeGoalCard } from './LifeGoalComponents';
import { DenseTaskNode } from './DenseTaskNode';
import { createTaskNode, updateNodeInTree, removeNodeFromTree, countTreeStats } from './DashboardUtils';

export function LifeGoalsSection({
  lifeGoals,
  updateLifeGoals,
  toggleTierCollapse,
  moveGoalToTier,
  updateGoal,
  deleteGoal,
  goalDeadlineEditing,
  setGoalDeadlineEditing,
  goalDeadlineInput,
  setGoalDeadlineInput,
  getDeadlineColorClass,
  formatDeadline,
  top3Manual,
  setTop3SlotAtIndex,
  promoteGoalToProjects,
  promoteGoalToQuickTasks,
  projects,
  quickTasks,
  goalTaskDrafts,
  setGoalTaskDrafts,
  setProjects,
  setQuickTasks,
  addGoalToTier
}) {
  return (
    <div className="shrink-0 px-6 pb-6 lg:pb-10">
      <div className="dashboard-panel flex flex-col gap-4 p-6 border-none shadow-xl bg-white/70 backdrop-blur-md dark:bg-[#161920]/70">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="flex items-center gap-2.5 text-lg font-black tracking-tight text-zinc-900 dark:text-white">
              <div className="p-2 rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-500/30">
                <Icons.Target className="w-5 h-5" />
              </div>
              Life Goals
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 pl-11">Building the Future</p>
          </div>
          
          <button
            onClick={() => updateLifeGoals(p => ({ ...p, collapsed: !p.collapsed }))}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 transition-all text-zinc-500"
          >
            {lifeGoals.collapsed ? <Icons.ChevronDown className="h-5 w-5" /> : <Icons.ChevronUp className="h-5 w-5" />}
          </button>
        </div>

        {!lifeGoals.collapsed && (
          <div className="flex flex-col gap-5">
            {lifeGoals.tiers.map((tier) => {
              const completedCount = tier.goals.filter(g => g.done).length;
              const totalCount = tier.goals.length;
              const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div
                  key={tier.id}
                  className="group/tier flex flex-col rounded-2xl border border-zinc-100 dark:border-white/[0.04] transition-all"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-zinc-50/50', 'dark:bg-white/[0.02]'); }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('bg-zinc-50/50', 'dark:bg-white/[0.02]')}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('bg-zinc-50/50', 'dark:bg-white/[0.02]');
                    try { const d = JSON.parse(e.dataTransfer.getData('application/json')); if (d.type === 'lifeGoal') moveGoalToTier(d.goalId, tier.id); } catch (_) { }
                  }}
                >
                  {/* Tier header — more refined */}
                  <div
                    className="flex cursor-pointer items-center justify-between px-4 py-4 transition-all hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] rounded-2xl"
                    onClick={() => toggleTierCollapse(tier.id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5 text-xl shadow-inner group-hover/tier:scale-110 transition-transform">
                        {tier.emoji}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[15px] font-black text-zinc-800 dark:text-zinc-100 tracking-tight">{tier.name}</span>
                        <div className="flex items-center gap-2">
                           <div className="w-24 h-1 rounded-full bg-zinc-100 dark:bg-white/5 overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                           </div>
                           <span className="text-[10px] font-bold text-zinc-400 tabular-nums">{completedCount}/{totalCount} goals</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-400 group-hover/tier:text-zinc-600 dark:group-hover/tier:text-zinc-200 transition-colors">
                      <Icons.ChevronDown className={`h-4 w-4 transition-transform duration-300 ${tier.collapsed ? '' : 'rotate-180'}`} />
                    </div>
                  </div>

                  {!tier.collapsed && (
                    <div className="animate-slide-down flex flex-col gap-6 px-4 pb-5 pt-2">
                      {tier.goals.length === 0 && (
                        <div className="relative overflow-hidden min-h-[4rem] rounded-2xl border-2 border-dashed border-zinc-100 dark:border-white/[0.04] flex items-center justify-center group/empty transition-all hover:border-indigo-500/30">
                          <span className="text-xs font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest group-hover/empty:text-indigo-400 transition-colors">Drop or add goals</span>
                        </div>
                      )}

                      {/* QUICK GOALS - Grid based */}
                      {tier.goals.some(g => g.type === 'quick') && (
                        <div className="space-y-3">
                          <h4 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400/80">Micro Movements</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {tier.goals.filter(g => g.type === 'quick').map((goal) => (
                              <LifeGoalCard
                                key={goal.id} goal={goal} accent={tier.id === 'tier-1' ? 'emerald' : tier.id === 'tier-2' ? 'sky' : 'violet'} stats={{}} percentage={0}
                                onToggle={(gid, val) => {
                                  updateGoal(gid, g => ({ ...g, done: val }));
                                  setQuickTasks(prev => prev.map(t => t.lifeGoalId === gid ? { ...t, done: val } : t));
                                }}
                                onDelete={deleteGoal}
                                onRename={(gid, val, type) => updateGoal(gid, g => ({ ...g, title: val, type: type || g.type }))}
                                onDeadline={(gid, val) => updateGoal(gid, g => ({ ...g, deadline: val || null }))}
                                onDeadlineClick={(gid, val) => { updateGoal(gid, g => ({ ...g, deadline: val.trim() || null })); setGoalDeadlineEditing(null); }}
                                deadlineEditing={goalDeadlineEditing} deadlineInput={goalDeadlineInput}
                                setDeadlineInput={setGoalDeadlineInput} setDeadlineEditing={setGoalDeadlineEditing}
                                getDeadlineColorClass={getDeadlineColorClass} formatDeadline={formatDeadline}
                                onAddToTop3={(gid) => { const free = top3Manual.findIndex(s => !s); if (free !== -1) setTop3SlotAtIndex(free, { projectId: `lg-${gid}`, taskId: gid }); }}
                                hasFreeTop3Slot={top3Manual.some(s => !s)}
                                onPromoteProject={promoteGoalToProjects}
                                onPromoteQuick={promoteGoalToQuickTasks}
                                isLinkedToProject={projects.some((project) => project.lifeGoalId === goal.id)}
                                isLinkedToQuick={quickTasks.some((task) => task.lifeGoalId === goal.id && !task.parentId)}
                                renderTasks={() => null}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* PROJECT GOALS - Larger prominence */}
                      {tier.goals.some(g => g.type === 'project') && (
                        <div className="space-y-3">
                          <h4 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400/80">Macro Projects</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {tier.goals.filter(g => g.type === 'project').map((goal) => {
                              const stats = countTreeStats(goal.tasks);
                              const percentage = Math.round(stats.ratio * 100);
                              return (
                                <LifeGoalCard
                                  key={goal.id} goal={goal} accent={tier.id === 'tier-1' ? 'emerald' : tier.id === 'tier-2' ? 'sky' : 'violet'} stats={stats} percentage={percentage}
                                  onToggle={(gid, val) => {
                                    updateGoal(gid, g => ({ ...g, done: val }));
                                    setQuickTasks(prev => prev.map(t => t.lifeGoalId === gid ? { ...t, done: val } : t));
                                  }}
                                  onDelete={deleteGoal}
                                  onRename={(gid, val, type) => updateGoal(gid, g => ({ ...g, title: val, type: type || g.type }))}
                                  onDeadline={(gid, val) => updateGoal(gid, g => ({ ...g, deadline: val || null }))}
                                  onDeadlineClick={(gid, val) => { updateGoal(gid, g => ({ ...g, deadline: val.trim() || null })); setGoalDeadlineEditing(null); }}
                                  deadlineEditing={goalDeadlineEditing} deadlineInput={goalDeadlineInput}
                                  setDeadlineInput={setGoalDeadlineInput} setDeadlineEditing={setGoalDeadlineEditing}
                                  getDeadlineColorClass={getDeadlineColorClass} formatDeadline={formatDeadline}
                                  onAddToTop3={() => { }}
                                  hasFreeTop3Slot={false}
                                  onPromoteProject={promoteGoalToProjects}
                                  onPromoteQuick={promoteGoalToQuickTasks}
                                  isLinkedToProject={projects.some((project) => project.lifeGoalId === goal.id)}
                                  isLinkedToQuick={quickTasks.some((task) => task.lifeGoalId === goal.id && !task.parentId)}
                                  renderTasks={() => (
                                    <>
                                      {goal.tasks?.map((node) => (
                                        <DenseTaskNode
                                          key={node.id} node={node} depth={0} projectId={`lg-${goal.id}`} projectAccent={tier.color}
                                          onToggle={(tid, val) => {
                                            updateGoal(goal.id, g => ({ ...g, tasks: updateNodeInTree(g.tasks, tid, n => ({ ...n, done: val })) }));
                                            setProjects(prev => prev.map(p => p.lifeGoalId === goal.id ? { ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, done: val })) } : p));
                                          }}
                                          onDelete={(tid) => updateGoal(goal.id, g => ({ ...g, tasks: removeNodeFromTree(g.tasks, tid) }))}
                                          onRename={(tid, val) => updateGoal(goal.id, g => ({ ...g, tasks: updateNodeInTree(g.tasks, tid, n => ({ ...n, title: val })) }))}
                                          onDeadline={(tid, val) => updateGoal(goal.id, g => ({ ...g, tasks: updateNodeInTree(g.tasks, tid, n => ({ ...n, deadline: val || undefined })) }))}
                                          onAddChild={(tid, val) => updateGoal(goal.id, g => ({ ...g, tasks: updateNodeInTree(g.tasks, tid, n => ({ ...n, children: [...(n.children || []), createTaskNode(val)] })) }))}
                                          onToggleTop3={(pid, tid) => { const free = top3Manual.findIndex(s => !s); if (free !== -1) setTop3SlotAtIndex(free, { projectId: pid, taskId: tid }); }}
                                          hasFreeTop3Slot={top3Manual.some(s => !s)}
                                        />
                                      ))}
                                      <div className="pt-2">
                                        <input
                                          value={goalTaskDrafts[goal.id] ?? ''}
                                          onChange={(e) => setGoalTaskDrafts(prev => ({ ...prev, [goal.id]: e.target.value }))}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              const title = (goalTaskDrafts[goal.id] ?? '').trim();
                                              if (title) {
                                                updateGoal(goal.id, g => ({ ...g, tasks: [...(g.tasks || []), createTaskNode(title)] }));
                                                setGoalTaskDrafts(prev => ({ ...prev, [goal.id]: '' }));
                                              }
                                            }
                                          }}
                                          placeholder="+ Aggiungi task..."
                                          className="w-full bg-transparent text-xs text-zinc-500 dark:text-zinc-400 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                                        />
                                      </div>
                                    </>
                                  )}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => { const title = window.prompt("Quick goal:"); if (title) addGoalToTier(tier.id, title, 'General', 'quick'); }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-[11px] font-black uppercase tracking-wider text-zinc-500 transition-all"
                        >
                          <Icons.Plus className="h-3.5 w-3.5" /> Quick
                        </button>
                        <button
                          onClick={() => { const title = window.prompt("Progetto:"); if (title) addGoalToTier(tier.id, title, 'General', 'project'); }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-[11px] font-black uppercase tracking-wider text-white dark:text-indigo-400 transition-all shadow-lg shadow-indigo-500/20"
                        >
                          <Icons.Plus className="h-3.5 w-3.5" /> Project
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
