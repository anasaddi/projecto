import React, { memo, useMemo, useState } from 'react';
import { CardV3 } from '../ui/CardV3';
import { ButtonV3 } from '../ui/ButtonV3';
import { useDashboardStore } from '../../../store/dashboardStore';
import type { LifeGoalsState, LifeGoalTier, LifeGoal } from '../../../types/dashboard';

export const LifeGoalsV3 = memo(function LifeGoalsV3() {
  const lifeGoals = (useDashboardStore((s: any) => s.lifeGoals) ?? { tiers: [] }) as LifeGoalsState;
  const toggleTierCollapse = useDashboardStore((s: any) => s.toggleTierCollapse);
  const promoteGoalToProjects = useDashboardStore((s: any) => s.promoteGoalToProjects);
  const promoteGoalToQuickTasks = useDashboardStore((s: any) => s.promoteGoalToQuickTasks);
  const addGoalToTier = useDashboardStore((s: any) => s.addGoalToTier);
  const [drafts, setDrafts] = useState<Record<string, { quick: string; project: string }>>({});

  const totals = useMemo(() => {
    const goals = lifeGoals.tiers.flatMap((tier: LifeGoalTier) => tier.goals as LifeGoal[]);
    const done = goals.filter((g: LifeGoal) => g.done).length;
    return { goals: goals.length, done };
  }, [lifeGoals]);

  return (
    <CardV3 className="h-full flex flex-col" elevated>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--d3-text)]">Life Goals</h3>
          <p className="text-sm text-[var(--d3-text-muted)]">
            {totals.done}/{totals.goals} goals tracked
          </p>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full text-[var(--d3-warning)]" style={{ backgroundColor: 'var(--d3-warning-bg)' }}>
          Long term
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-auto pr-1">
        {lifeGoals.tiers.map((tier: LifeGoalTier) => {
          const tierDone = tier.goals.filter((g: LifeGoal) => g.done).length;
          const pct = tier.goals.length ? (tierDone / tier.goals.length) * 100 : 0;
          return (
            <div key={tier.id} className="rounded-[var(--d3-radius-lg)] border border-[var(--d3-border)] bg-[var(--d3-surface-elevated)] overflow-hidden">
              <button
                type="button"
                onClick={() => toggleTierCollapse(tier.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span>{tier.emoji}</span>
                    <span className="font-medium text-[var(--d3-text)]">{tier.name}</span>
                  </div>
                  <p className="text-xs text-[var(--d3-text-muted)]">{tierDone}/{tier.goals.length} completed</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-[var(--d3-text-muted)]">{Math.round(pct)}%</div>
                  <div className="mt-1 h-2 w-20 rounded-full bg-[var(--d3-border)] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(to right, var(--d3-primary), var(--d3-primary-light))' }} />
                  </div>
                </div>
              </button>
              {!tier.collapsed && (
                <div className="border-t border-[var(--d3-border)] p-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-1">
                    <div className="flex gap-2">
                      <input
                        value={drafts[tier.id]?.quick ?? ''}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [tier.id]: { quick: e.target.value, project: prev[tier.id]?.project ?? '' } }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const title = (drafts[tier.id]?.quick ?? '').trim();
                            if (title) {
                              addGoalToTier(tier.id, title, 'General', 'quick');
                              setDrafts((prev) => ({ ...prev, [tier.id]: { quick: '', project: prev[tier.id]?.project ?? '' } }));
                            }
                          }
                        }}
                        placeholder="Quick goal..."
                        className="flex-1 rounded-[var(--d3-radius-md)] border border-[var(--d3-border)] bg-[var(--d3-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--d3-primary)]"
                      />
                      <ButtonV3 variant="ghost" size="sm" onClick={() => {
                        const title = (drafts[tier.id]?.quick ?? '').trim();
                        if (title) {
                          addGoalToTier(tier.id, title, 'General', 'quick');
                          setDrafts((prev) => ({ ...prev, [tier.id]: { quick: '', project: prev[tier.id]?.project ?? '' } }));
                        }
                      }}>Quick</ButtonV3>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={drafts[tier.id]?.project ?? ''}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [tier.id]: { quick: prev[tier.id]?.quick ?? '', project: e.target.value } }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const title = (drafts[tier.id]?.project ?? '').trim();
                            if (title) {
                              addGoalToTier(tier.id, title, 'General', 'project');
                              setDrafts((prev) => ({ ...prev, [tier.id]: { quick: prev[tier.id]?.quick ?? '', project: '' } }));
                            }
                          }
                        }}
                        placeholder="Project goal..."
                        className="flex-1 rounded-[var(--d3-radius-md)] border border-[var(--d3-border)] bg-[var(--d3-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--d3-primary)]"
                      />
                      <ButtonV3 variant="primary" size="sm" onClick={() => {
                        const title = (drafts[tier.id]?.project ?? '').trim();
                        if (title) {
                          addGoalToTier(tier.id, title, 'General', 'project');
                          setDrafts((prev) => ({ ...prev, [tier.id]: { quick: prev[tier.id]?.quick ?? '', project: '' } }));
                        }
                      }}>Project</ButtonV3>
                    </div>
                  </div>

                  {tier.goals.map((goal: LifeGoal) => (
                    <div key={goal.id} className="rounded-[var(--d3-radius-md)] border border-[var(--d3-border)] bg-[var(--d3-surface)] px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${goal.done ? 'line-through text-[var(--d3-text-muted)]' : 'text-[var(--d3-text)]'}`}>{goal.title}</p>
                          <p className="text-xs text-[var(--d3-text-muted)]">{goal.category} · {goal.type}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <ButtonV3 variant="ghost" size="sm" onClick={() => promoteGoalToQuickTasks(goal.id)}>Quick</ButtonV3>
                          <ButtonV3 variant="ghost" size="sm" onClick={() => promoteGoalToProjects(goal.id)}>Project</ButtonV3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </CardV3>
  );
});
