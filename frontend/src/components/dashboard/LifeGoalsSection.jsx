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
    <div className="shrink-0 px-6 pb-6">
      <div className="dashboard-panel flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 dashboard-section-title text-violet-500 dark:text-violet-400">
            <Icons.Target className="w-3.5 h-3.5" /> Life Goals
          </h2>
          <button
            onClick={() => updateLifeGoals(p => ({ ...p, collapsed: !p.collapsed }))}
            className="dashboard-action-btn"
          >
            {lifeGoals.collapsed ? <Icons.ChevronDown className="h-3.5 w-3.5" /> : <Icons.ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>

        {!lifeGoals.collapsed && (
          <div className="flex flex-col gap-3">
            {lifeGoals.tiers.map((tier) => {
              const completedCount = tier.goals.filter(g => g.done).length;
              const totalCount = tier.goals.length;

              return (
                <div
                  key={tier.id}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-200/60 dark:border-white/[0.04]"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-zinc-50'); }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('bg-zinc-50')}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('bg-zinc-50');
                    try { const d = JSON.parse(e.dataTransfer.getData('application/json')); if (d.type === 'lifeGoal') moveGoalToTier(d.goalId, tier.id); } catch (_) { }
                  }}
                >
                  {/* Tier header */}
                  <div
                    className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.04]"
                    onClick={() => toggleTierCollapse(tier.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">{tier.emoji}</span>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{tier.name}</span>
                      <span className="text-xs text-zinc-400">{completedCount}/{totalCount}</span>
                    </div>
                    <Icons.ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${tier.collapsed ? '' : 'rotate-180'}`} />
                  </div>

                  {!tier.collapsed && (
                    <div className="animate-slide-down flex flex-col gap-3 px-3 pb-3">
                      {tier.goals.length === 0 && (
                        <div className="relative overflow-hidden min-h-[3.25rem] rounded-xl border border-dashed border-zinc-200 dark:border-white/[0.06] flex items-center">
                          <span className="absolute -right-2 -bottom-3 text-[4rem] font-black text-zinc-200 dark:text-white/[0.04] pointer-events-none select-none leading-none z-0">+</span>
                          <span className="relative z-10 pl-4 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Trascina qui</span>
                        </div>
                      )}
                      {/* QUICK GOALS */}
                      {tier.goals.some(g => g.type === 'quick') && (
                        <div className="flex flex-col gap-1.5">
                          <span className="px-1 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-400">Quick</span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                            {tier.goals.filter(g => g.type === 'quick').map((goal) => (
                              <LifeGoalCard
                                key={goal.id} goal={goal} accent={tier.color} stats={{}} percentage={0}
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

                      {/* PROJECT GOALS */}
                      {tier.goals.some(g => g.type === 'project') && (
                        <div className="flex flex-col gap-1.5">
                          <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">Projects</span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
                            {tier.goals.filter(g => g.type === 'project').map((goal) => {
                              const stats = countTreeStats(goal.tasks);
                              const percentage = Math.round(stats.ratio * 100);
                              return (
                                <LifeGoalCard
                                  key={goal.id} goal={goal} accent={tier.color} stats={stats} percentage={percentage}
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
                                          onAddToTop3={(pid, tid) => { const free = top3Manual.findIndex(s => !s); if (free !== -1) setTop3SlotAtIndex(free, { projectId: pid, taskId: tid }); }}
                                          hasFreeTop3Slot={top3Manual.some(s => !s)}
                                        />
                                      ))}
                                      <div className="pt-1">
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
                                          placeholder="+ task..."
                                          className="seamless-input text-sm text-zinc-500 placeholder:text-zinc-300"
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

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { const title = window.prompt("Quick goal:"); if (title) addGoalToTier(tier.id, title, 'General', 'quick'); }}
                          className="dashboard-chip text-[10px] hover:text-zinc-600"
                        >
                          <Icons.Plus className="h-2.5 w-2.5" /> Quick
                        </button>
                        <button
                          onClick={() => { const title = window.prompt("Progetto:"); if (title) addGoalToTier(tier.id, title, 'General', 'project'); }}
                          className="dashboard-chip text-[10px] hover:text-zinc-600"
                        >
                          <Icons.Plus className="h-2.5 w-2.5" /> Project
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
