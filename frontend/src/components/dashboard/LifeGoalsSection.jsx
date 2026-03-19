import React, { useCallback } from 'react';
import { Icons } from './Icons';
import { LifeGoalCard } from './LifeGoalComponents';
import { DenseTaskNode } from './DenseTaskNode';
import { LifeGoalTierRow } from './LifeGoalTierRow';
import { createTaskNode, updateNodeInTree, removeNodeFromTree, countTreeStats, getDeadlineColorClass, formatDeadline } from './DashboardUtils';
import { useDashboardStore } from '../../store/dashboardStore';
import { useToast } from '../../context/ToastContext';

export function LifeGoalsSection() {
  const store = useDashboardStore();
  const {
    lifeGoals = { tiers: [] },
    updateLifeGoals,
    toggleTierCollapse,
    moveGoalToTier,
    updateGoal,
    deleteGoal,
    setConfirmState,
    goalDeadlineEditing,
    setGoalDeadlineEditing,
    goalDeadlineInput,
    setGoalDeadlineInput,
    top3Manual = [null, null, null],
    setTop3SlotAtIndex,
    promoteGoalToProjects,
    promoteGoalToQuickTasks,
    projects = [],
    quickTasks = [],
    goalTaskDrafts = {},
    setGoalTaskDrafts,
    setProjects,
    setQuickTasks,
    toggleQuickTask,
    addGoalToTier
  } = store ?? {};

  const showToast = useToast();
  const getTop3IndexForGoal = useCallback((gid) => top3Manual.findIndex(s => s && (
    (s.projectId === `lg-${gid}` && s.taskId === gid) ||
    (s.quickTaskId && quickTasks.some(qt => qt.id === s.quickTaskId && qt.lifeGoalId === gid))
  )), [top3Manual, quickTasks]);
  const handleToggleTop3 = useCallback((gid) => {
    const idx = getTop3IndexForGoal(gid);
    if (idx !== -1) setTop3SlotAtIndex(idx, null);
    else {
      const free = top3Manual.findIndex(s => !s);
      if (free !== -1) {
        const qt = quickTasks.find(t => t.lifeGoalId === gid && !t.parentId);
        setTop3SlotAtIndex(free, qt ? { quickTaskId: qt.id, shareId: null } : { projectId: `lg-${gid}`, taskId: gid });
      }
    }
  }, [getTop3IndexForGoal, top3Manual, setTop3SlotAtIndex, quickTasks]);
  const handlePromoteProject = useCallback((goalId) => {
    const wasLinked = projects.some((p) => p.lifeGoalId === goalId);
    promoteGoalToProjects(goalId);
    showToast(wasLinked ? 'Rimosso da Progetti' : 'Collegato a Progetti');
  }, [projects, promoteGoalToProjects, showToast]);
  const handlePromoteQuick = useCallback((goalId) => {
    const wasLinked = quickTasks.some((t) => t.lifeGoalId === goalId && !t.parentId);
    promoteGoalToQuickTasks(goalId);
    showToast(wasLinked ? 'Rimosso da Quick Tasks' : 'Collegato a Quick Tasks');
  }, [quickTasks, promoteGoalToQuickTasks, showToast]);

  return (
    <div className="shrink-0 px-4 pb-4 lg:pb-6">
      <div className="dashboard-panel flex flex-col gap-3 p-4 border-none shadow-xl bg-white/70 backdrop-blur-md dark:bg-[#161920]/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-500 text-white shadow-md shadow-violet-500/25">
              <Icons.Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-zinc-900 dark:text-white">Life Goals</h2>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Building the Future</p>
            </div>
          </div>
          <button
            onClick={() => updateLifeGoals(p => ({ ...p, collapsed: !p.collapsed }))}
            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 transition-all text-zinc-500"
          >
            {lifeGoals.collapsed ? <Icons.ChevronDown className="h-4 w-4" /> : <Icons.ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {!lifeGoals.collapsed && (
          <div className="flex flex-col gap-3">
            {(lifeGoals.tiers ?? []).map((tier) => (
              <LifeGoalTierRow
                key={tier.id}
                tier={tier}
                onToggleCollapse={toggleTierCollapse}
                onDrop={moveGoalToTier}
              >
                {tier.goals.length === 0 && (
                        <div className="relative overflow-hidden min-h-[3rem] rounded-xl border-2 border-dashed border-zinc-100 dark:border-white/[0.04] flex items-center justify-center group/empty transition-all hover:border-indigo-500/30">
                          <span className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest group-hover/empty:text-indigo-400 transition-colors">Drop or add goals</span>
                        </div>
                      )}

                      {tier.goals.some(g => g.type === 'quick') && (
                        <div className="space-y-2">
                          <h4 className="px-0.5 text-[9px] font-black uppercase tracking-widest text-zinc-400/80">Micro Movements</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1.5">
                            {tier.goals.filter(g => g.type === 'quick').map((goal) => (
                              <LifeGoalCard
                                key={goal.id} goal={goal} compact
                                accent={tier.id === 'tier-1' ? 'emerald' : tier.id === 'tier-2' ? 'sky' : 'violet'} stats={{}} percentage={0}
                                onToggle={(gid, val) => {
                                  updateGoal(gid, g => ({ ...g, done: val }));
                                  const qt = quickTasks.find(t => t.lifeGoalId === gid && !t.parentId);
                                  if (qt) toggleQuickTask(qt.id, val);
                                  else setQuickTasks(prev => prev.map(t => t.lifeGoalId === gid ? { ...t, done: val } : t));
                                }}
                                onDelete={(gid) => setConfirmState?.({ id: 'deleteGoal', payload: { goalId: gid } })}
                                onRename={(gid, val, type) => updateGoal(gid, g => ({ ...g, title: val, type: type || g.type }))}
                                onDeadline={(gid, val) => updateGoal(gid, g => ({ ...g, deadline: val || null }))}
                                onDeadlineClick={(gid, val) => { updateGoal(gid, g => ({ ...g, deadline: val.trim() || null })); setGoalDeadlineEditing(null); }}
                                deadlineEditing={goalDeadlineEditing} deadlineInput={goalDeadlineInput}
                                setDeadlineInput={setGoalDeadlineInput} setDeadlineEditing={setGoalDeadlineEditing}
                                getDeadlineColorClass={getDeadlineColorClass} formatDeadline={formatDeadline}
                                onToggleTop3={handleToggleTop3}
                                isInTop3={getTop3IndexForGoal(goal.id) !== -1}
                                hasFreeTop3Slot={top3Manual.some(s => !s)}
                                onPromoteProject={handlePromoteProject}
                                onPromoteQuick={handlePromoteQuick}
                                isLinkedToProject={projects.some((project) => project.lifeGoalId === goal.id)}
                                isLinkedToQuick={quickTasks.some((task) => task.lifeGoalId === goal.id && !task.parentId)}
                                renderTasks={() => null}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {tier.goals.some(g => g.type === 'project') && (
                        <div className="space-y-2">
                          <h4 className="px-0.5 text-[9px] font-black uppercase tracking-widest text-zinc-400/80">Macro Projects</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                            {tier.goals.filter(g => g.type === 'project').map((goal) => {
                              const stats = countTreeStats(goal.tasks);
                              const percentage = Math.round(stats.ratio * 100);
                              return (
                                <LifeGoalCard
                                  key={goal.id} goal={goal} accent={tier.id === 'tier-1' ? 'emerald' : tier.id === 'tier-2' ? 'sky' : 'violet'} stats={stats} percentage={percentage}
                                  onToggle={(gid, val) => {
                                    updateGoal(gid, g => ({ ...g, done: val }));
                                    const qt = quickTasks.find(t => t.lifeGoalId === gid && !t.parentId);
                                    if (qt) toggleQuickTask(qt.id, val);
                                    else setQuickTasks(prev => prev.map(t => t.lifeGoalId === gid ? { ...t, done: val } : t));
                                  }}
                                  onDelete={(gid) => setConfirmState?.({ id: 'deleteGoal', payload: { goalId: gid } })}
                                  onRename={(gid, val, type) => updateGoal(gid, g => ({ ...g, title: val, type: type || g.type }))}
                                  onDeadline={(gid, val) => updateGoal(gid, g => ({ ...g, deadline: val || null }))}
                                  onDeadlineClick={(gid, val) => { updateGoal(gid, g => ({ ...g, deadline: val.trim() || null })); setGoalDeadlineEditing(null); }}
                                  deadlineEditing={goalDeadlineEditing} deadlineInput={goalDeadlineInput}
                                  setDeadlineInput={setGoalDeadlineInput} setDeadlineEditing={setGoalDeadlineEditing}
                                  getDeadlineColorClass={getDeadlineColorClass} formatDeadline={formatDeadline}
                                  onToggleTop3={handleToggleTop3}
                                  isInTop3={getTop3IndexForGoal(goal.id) !== -1}
                                  hasFreeTop3Slot={top3Manual.some(s => !s)}
                                  onPromoteProject={handlePromoteProject}
                                  onPromoteQuick={handlePromoteQuick}
                                  isLinkedToProject={projects.some((project) => project.lifeGoalId === goal.id)}
                                  isLinkedToQuick={quickTasks.some((task) => task.lifeGoalId === goal.id && !task.parentId)}
                                  renderTasks={() => (
                                    <>
                                      {goal.tasks?.map((node) => (
                                        <DenseTaskNode
                                          key={node.id}
                                          node={node}
                                          depth={0}
                                          projectId={`lg-${goal.id}`}
                                          projectAccent={tier.color}
                                          hideTop3Button={true}
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

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { const title = window.prompt("Quick goal:"); if (title) addGoalToTier(tier.id, title, 'General', 'quick'); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-[10px] font-black uppercase tracking-wider text-zinc-500 transition-all"
                  >
                    <Icons.Plus className="h-3 w-3" /> Quick
                  </button>
                  <button
                    type="button"
                    onClick={() => { const title = window.prompt("Progetto:"); if (title) addGoalToTier(tier.id, title, 'General', 'project'); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-[10px] font-black uppercase tracking-wider text-white dark:text-indigo-400 transition-all shadow-md shadow-indigo-500/20"
                  >
                    <Icons.Plus className="h-3 w-3" /> Project
                  </button>
                </div>
              </LifeGoalTierRow>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
