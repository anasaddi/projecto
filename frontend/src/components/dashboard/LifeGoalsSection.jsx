import React, { useCallback } from 'react';
import { Icons } from './Icons';
import { LifeGoalCard } from './LifeGoalComponents';
import { DenseTaskNode } from './DenseTaskNode';
import { LifeGoalTierRow } from './LifeGoalTierRow';
import { createTaskNode, updateNodeInTree, removeNodeFromTree, countTreeStats, getDeadlineColorClass, formatDeadline } from './DashboardUtils';
import { useDashboardStore } from '../../store/dashboardStore';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardBody } from './Card';
import { AddItemInputBar } from './AddItemInputBar';

export function LifeGoalsSection() {
  const lifeGoals = useDashboardStore((s) => s.lifeGoals) ?? { tiers: [] };
  const updateLifeGoals = useDashboardStore((s) => s.updateLifeGoals);
  const toggleTierCollapse = useDashboardStore((s) => s.toggleTierCollapse);
  const moveGoalToTier = useDashboardStore((s) => s.moveGoalToTier);
  const updateGoal = useDashboardStore((s) => s.updateGoal);
  const deleteGoal = useDashboardStore((s) => s.deleteGoal);
  const setConfirmState = useDashboardStore((s) => s.setConfirmState);
  const goalDeadlineEditing = useDashboardStore((s) => s.goalDeadlineEditing);
  const setGoalDeadlineEditing = useDashboardStore((s) => s.setGoalDeadlineEditing);
  const goalDeadlineInput = useDashboardStore((s) => s.goalDeadlineInput);
  const setGoalDeadlineInput = useDashboardStore((s) => s.setGoalDeadlineInput);
  const top3Manual = useDashboardStore((s) => s.top3Manual) ?? [null, null, null];
  const setTop3SlotAtIndex = useDashboardStore((s) => s.setTop3SlotAtIndex);
  const promoteGoalToProjects = useDashboardStore((s) => s.promoteGoalToProjects);
  const promoteGoalToQuickTasks = useDashboardStore((s) => s.promoteGoalToQuickTasks);
  const projects = useDashboardStore((s) => s.projects) ?? [];
  const quickTasks = useDashboardStore((s) => s.quickTasks) ?? [];
  const goalTaskDrafts = useDashboardStore((s) => s.goalTaskDrafts) ?? {};
  const setGoalTaskDrafts = useDashboardStore((s) => s.setGoalTaskDrafts);
  const setProjects = useDashboardStore((s) => s.setProjects);
  const setQuickTasks = useDashboardStore((s) => s.setQuickTasks);
  const toggleQuickTask = useDashboardStore((s) => s.toggleQuickTask);
  const addGoalToTier = useDashboardStore((s) => s.addGoalToTier);

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
      } else {
        showToast?.('I Top 3 sono già pieni. Rimuovi prima un elemento.', 'warning');
      }
    }
  }, [getTop3IndexForGoal, top3Manual, setTop3SlotAtIndex, quickTasks, showToast]);
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
    <div className="shrink-0">
      <Card className="flex flex-col">
        <CardHeader
          icon={Icons.Target}
          iconColor="text-violet-500"
          title="Life Goals"
          subtitle="Costruisci il futuro"
          action={
            <button
              type="button"
              onClick={() => updateLifeGoals((p) => ({ ...p, collapsed: !p.collapsed }))}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
              aria-expanded={!lifeGoals.collapsed}
            >
              {lifeGoals.collapsed ? <Icons.ChevronDown className="h-4 w-4" /> : <Icons.ChevronUp className="h-4 w-4" />}
            </button>
          }
        />

        {!lifeGoals.collapsed && (
          <CardBody padding="normal" className="flex flex-col gap-3 pt-2">
            {(lifeGoals.tiers ?? []).map((tier) => (
              <LifeGoalTierRow
                key={tier.id}
                tier={tier}
                onToggleCollapse={toggleTierCollapse}
                onDrop={moveGoalToTier}
              >
                {tier.goals.length === 0 && (
                  <div className="relative flex min-h-[3rem] items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-200/80 dark:border-white/[0.1] bg-zinc-50/40 dark:bg-white/[0.02] transition-all group/empty hover:border-indigo-400/40 dark:hover:border-indigo-500/30">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 transition-colors group-hover/empty:text-indigo-500 dark:group-hover/empty:text-indigo-400">Trascina o aggiungi obiettivi</span>
                  </div>
                )}

                {tier.goals.some(g => g.type === 'quick') && (
                  <div className="flex flex-col gap-1">
                    <h4 className="px-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Micro movements</h4>
                    <div className="flex flex-col gap-1">
                      {tier.goals.filter(g => g.type === 'quick').map((goal) => (
                        <LifeGoalCard
                          key={goal.id} goal={goal} compact
                          accent={tier.id === 'tier-1' ? 'emerald' : tier.id === 'tier-2' ? 'sky' : 'violet'} stats={{}} percentage={0}
                          onToggle={(gid, val) => {
                            updateGoal(gid, g => ({ ...g, done: val }));
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
                          <h4 className="px-0.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Macro progetti</h4>
                          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-3 auto-cols-fr">
                            {tier.goals.filter(g => g.type === 'project').map((goal) => {
                              const stats = countTreeStats(goal.tasks);
                              const percentage = Math.round(stats.ratio * 100);
                              return (
                                <LifeGoalCard
                                  key={goal.id} goal={goal} accent={tier.id === 'tier-1' ? 'emerald' : tier.id === 'tier-2' ? 'sky' : 'violet'} stats={stats} percentage={percentage}
                                  onToggle={(gid, val) => {
                                    updateGoal(gid, g => ({ ...g, done: val }));
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
                                        <AddItemInputBar
                                          value={goalTaskDrafts[goal.id] ?? ''}
                                          onChange={(val) => setGoalTaskDrafts(prev => ({ ...prev, [goal.id]: val }))}
                                          onSubmit={() => {
                                            const title = (goalTaskDrafts[goal.id] ?? '').trim();
                                            if (title) {
                                              updateGoal(goal.id, g => ({ ...g, tasks: [...(g.tasks || []), createTaskNode(title)] }));
                                              setGoalTaskDrafts(prev => ({ ...prev, [goal.id]: '' }));
                                            }
                                          }}
                                          placeholder="Aggiungi task..."
                                          buttonColor="violet"
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

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { const title = window.prompt("Quick goal:"); if (title) addGoalToTier(tier.id, title, 'General', 'quick'); }}
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 transition-all hover:bg-zinc-200 dark:bg-white/[0.05] dark:text-zinc-400 dark:hover:bg-white/[0.08]"
                  >
                    <Icons.Plus className="h-3 w-3" /> Quick
                  </button>
                  <button
                    type="button"
                    onClick={() => { const title = window.prompt("Progetto:"); if (title) addGoalToTier(tier.id, title, 'General', 'project'); }}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white shadow-md shadow-indigo-500/25 transition-all hover:shadow-lg hover:shadow-indigo-500/30 dark:from-indigo-500/90 dark:to-violet-600/90"
                  >
                    <Icons.Plus className="h-3 w-3" /> Project
                  </button>
                </div>
              </LifeGoalTierRow>
            ))}
          </CardBody>
        )}
      </Card>
    </div>
  );
}
