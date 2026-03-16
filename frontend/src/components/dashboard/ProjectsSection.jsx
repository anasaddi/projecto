import React from 'react';
import { Icons } from './Icons';
import { StandardProjectCard } from './ProjectComponents';
import { DenseTaskNode } from './DenseTaskNode';
import { createTaskNode, collectNodeAndDescendantIds, removeNodeFromTree, updateNodeInTree, countTreeStats } from './DashboardUtils';

export function ProjectsSection({
  projects,
  createProject,
  deleteProject,
  reorderProjects,
  reorderSharedDashboardProjects,
  updateProject,
  toggleProjectTask,
  projectTaskDrafts,
  setProjectTaskDrafts,
  setTop3Manual,
  setTop3SlotAtIndex,
  top3Manual,
  setDailyCompletionLog,
  moveProjectTask,
  moveSubtask,
  projectDeadlineEditing,
  projectDeadlineInput,
  setProjectDeadlineInput,
  setProjectDeadlineEditing,
  getDeadlineColorClass,
  formatDeadline,
  sharedDashboards,
  updateSharedDashboardProject,
  deleteSharedDashboardProject,
  PROJECT_ACCENTS
}) {
  return (
    <div className="dashboard-panel overflow-hidden flex min-h-0 flex-col p-4 sm:p-5 md:col-span-2 lg:col-span-6">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <h2 className="flex items-center gap-2 dashboard-section-title text-indigo-500 dark:text-indigo-400">
          <Icons.Square className="w-3.5 h-3.5" /> Projects
        </h2>
        <button
          onClick={createProject}
          className="flex h-7 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-semibold text-indigo-600 transition-all hover:bg-indigo-100 active:scale-95 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
        >
          <Icons.Plus className="h-3 w-3" />
          <span>Nuovo</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {projects.map((project, idx) => {
            const dragPayload = { type: 'project', fromIndex: idx };
            const actualStats = countTreeStats(project.tasks);
            const percentage = Math.round(actualStats.ratio * 100);
            const accent = PROJECT_ACCENTS[idx % PROJECT_ACCENTS.length];
            return (
              <div
                key={project.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify(dragPayload));
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-indigo-400'); }}
                onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-indigo-400')}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('ring-2', 'ring-indigo-400');
                  try {
                    const p = JSON.parse(e.dataTransfer.getData('application/json'));
                    if (p.type === 'project') reorderProjects(p.fromIndex, idx);
                  } catch (_) {}
                }}
                className="cursor-grab active:cursor-grabbing rounded-xl"
              >
              <StandardProjectCard
                project={project}
                stats={actualStats}
                percentage={percentage}
                accent={accent}
                isShared={false}
                onTitleChange={(val) => updateProject(project.id, p => ({ ...p, title: val }))}
                onDelete={deleteProject}
                onDeadlineClick={(val) => {
                  updateProject(project.id, p => ({ ...p, deadline: val.trim() || undefined }));
                  setProjectDeadlineEditing(null);
                }}
                projectDeadlineEditing={projectDeadlineEditing}
                projectDeadlineInput={projectDeadlineInput}
                setProjectDeadlineInput={setProjectDeadlineInput}
                setProjectDeadlineEditing={setProjectDeadlineEditing}
                getDeadlineColorClass={getDeadlineColorClass}
                formatDeadline={formatDeadline}
                renderTasks={() => (
                  <>
                    {project.tasks?.map((node, tIdx) => (
                      <DenseTaskNode
                        key={node.id} node={node} depth={0} projectId={project.id} projectAccent={accent}
                        onToggle={(tid, val) => toggleProjectTask(project.id, tid, val)}
                        onDelete={(tid) => {
                          const idsToClear = collectNodeAndDescendantIds(project.tasks, tid);
                          updateProject(project.id, p => ({ ...p, tasks: removeNodeFromTree(p.tasks, tid) }));
                          setTop3Manual(prev => prev.map(s => (s && s.projectId === project.id && idsToClear.has(s.taskId)) ? null : s));
                          setDailyCompletionLog(prev => {
                            const next = {};
                            Object.entries(prev).forEach(([k, day]) => {
                              const projectKeys = Array.isArray(day?.project) ? day.project.filter(x => { const [pid, taskId] = String(x).split(':'); return pid !== project.id || !idsToClear.has(taskId); }) : [];
                              const quick = Array.isArray(day?.quick) ? day.quick : [];
                              if (projectKeys.length || quick.length) next[k] = { quick, project: projectKeys };
                            });
                            return next;
                          });
                        }}
                        onRename={(tid, val) => updateProject(project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, title: val })) }))}
                        onDeadline={(tid, val) => updateProject(project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, deadline: val || undefined })) }))}
                        onAddChild={(tid, val) => updateProject(project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, children: [...(n.children || []), createTaskNode(val)] })) }))}
                        onToggleTop3={(pid, tid) => {
                          const existingIdx = top3Manual.findIndex(s => s && s.projectId === pid && s.taskId === tid && !s.shareId);
                          if (existingIdx !== -1) {
                            setTop3SlotAtIndex(existingIdx, null);
                          } else {
                            const free = top3Manual.findIndex(s => !s);
                            if (free !== -1) setTop3SlotAtIndex(free, { projectId: pid, taskId: tid, shareId: null });
                          }
                        }}
                        checkIsTop3={(tid) => top3Manual.some(s => s && s.projectId === project.id && s.taskId === tid && !s.shareId)}
                        onMove={(tid, targetIdx, pid) => pid ? moveSubtask(project.id, pid, tid, targetIdx) : moveProjectTask(project.id, tid, tIdx)}
                        hasFreeTop3Slot={top3Manual.some(s => !s)}
                      />
                    ))}
                    <div className="pt-1 pl-1">
                      <input
                        value={projectTaskDrafts[project.id] ?? ''}
                        onChange={(e) => setProjectTaskDrafts(prev => ({ ...prev, [project.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const title = (projectTaskDrafts[project.id] ?? '').trim();
                            if (title) {
                              updateProject(project.id, p => ({ ...p, tasks: [...(p.tasks || []), createTaskNode(title)] }));
                              setProjectTaskDrafts(prev => ({ ...prev, [project.id]: '' }));
                            }
                          }
                        }}
                        placeholder="Add task... (Enter)"
                        className="seamless-input text-sm text-zinc-500 dark:text-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                      />
                    </div>
                  </>
                )}
                    />
              </div>
            );
          })}
        </div>

        {/* SHARED PROJECTS */}
        {sharedDashboards.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex items-center gap-2 shrink-0 border-t border-zinc-100 dark:border-white/[0.05] pt-3">
              <h3 className="flex items-center gap-2 dashboard-section-title text-indigo-500 dark:text-indigo-400">
                <Icons.MessageCircle className="w-3.5 h-3.5" /> Shared
              </h3>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {sharedDashboards.map((shared, sIdx) => {
                const sharedData = shared.data || {};
                const sharedProjects = Array.isArray(sharedData.projects) ? sharedData.projects : (Array.isArray(sharedData) ? sharedData : []);

                return sharedProjects.map((project, pIdx) => {
                  const sharedDragPayload = { type: 'sharedProject', shareId: shared.share_id, fromIndex: pIdx };
                  const actualStats = countTreeStats(project.tasks);
                  const percentage = Math.round(actualStats.ratio * 100);
                  const accent = PROJECT_ACCENTS[(sIdx + pIdx + projects.length) % PROJECT_ACCENTS.length];

                  return (
                    <div
                      key={`${shared.share_id}-${project.id}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify(sharedDragPayload));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-indigo-400'); }}
                      onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-indigo-400')}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('ring-2', 'ring-indigo-400');
                        try {
                          const p = JSON.parse(e.dataTransfer.getData('application/json'));
                          if (p.type === 'sharedProject' && p.shareId === shared.share_id) reorderSharedDashboardProjects(p.shareId, p.fromIndex, pIdx);
                        } catch (_) {}
                      }}
                      className="cursor-grab active:cursor-grabbing rounded-xl"
                    >
                    <StandardProjectCard
                      project={project}
                      stats={actualStats}
                      percentage={percentage}
                      accent={accent}
                      isShared={true}
                      shareId={shared.share_id}
                      onTitleChange={(val) => updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, title: val }))}
                      onDelete={() => deleteSharedDashboardProject(shared.share_id, project.id)}
                      onDeadlineClick={(val) => {
                        updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, deadline: val.trim() || undefined }));
                        setProjectDeadlineEditing(null);
                      }}
                      projectDeadlineEditing={projectDeadlineEditing}
                      projectDeadlineInput={projectDeadlineInput}
                      setProjectDeadlineInput={setProjectDeadlineInput}
                      setProjectDeadlineEditing={setProjectDeadlineEditing}
                      getDeadlineColorClass={getDeadlineColorClass}
                      formatDeadline={formatDeadline}
                      renderTasks={() => (
                        <>
                          {project.tasks?.map((node, tIdx) => (
                            <DenseTaskNode
                              key={node.id} node={node} depth={0} projectId={project.id} projectAccent={accent}
                              onToggle={(tid, val) => updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, done: val })) }))}
                              onDelete={(tid) => updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, tasks: removeNodeFromTree(p.tasks, tid) }))}
                              onRename={(tid, val) => updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, title: val })) }))}
                              onDeadline={(tid, val) => updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, deadline: val || undefined })) }))}
                              onAddChild={(tid, val) => updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, children: [...(n.children || []), createTaskNode(val)] })) }))}
                              onToggleTop3={(pid, tid) => {
                                const existingIdx = top3Manual.findIndex(s => s && s.projectId === pid && s.taskId === tid && s.shareId === shared.share_id);
                                if (existingIdx !== -1) {
                                  setTop3SlotAtIndex(existingIdx, null);
                                } else {
                                  const free = top3Manual.findIndex(s => !s);
                                  if (free !== -1) setTop3SlotAtIndex(free, { projectId: pid, taskId: tid, shareId: shared.share_id });
                                }
                              }}
                              checkIsTop3={(tid) => top3Manual.some(s => s && s.projectId === project.id && s.taskId === tid && s.shareId === shared.share_id)}
                              onMove={(tid, targetIdx, pid) => {
                                if (pid) {
                                  updateSharedDashboardProject(shared.share_id, project.id, p => ({
                                    ...p,
                                    tasks: updateNodeInTree(p.tasks, pid, parent => {
                                      const next = [...(parent.children || [])];
                                      const fromIdx = next.findIndex(t => t.id === tid);
                                      if (fromIdx === -1) return parent;
                                      const [removed] = next.splice(fromIdx, 1);
                                      next.splice(targetIdx, 0, removed);
                                      return { ...parent, children: next };
                                    })
                                  }));
                                } else {
                                  updateSharedDashboardProject(shared.share_id, project.id, p => {
                                    const next = [...(p.tasks || [])];
                                    const fromIdx = next.findIndex(t => t.id === tid);
                                    if (fromIdx === -1) return p;
                                    const [removed] = next.splice(fromIdx, 1);
                                    next.splice(targetIdx, 0, removed);
                                    return { ...p, tasks: next };
                                  });
                                }
                              }}
                              hasFreeTop3Slot={top3Manual.some(s => !s)}
                            />
                          ))}
                          <div className="pt-1 pl-1">
                            <input
                              value={projectTaskDrafts[`${shared.share_id}-${project.id}`] ?? ''}
                              onChange={(e) => setProjectTaskDrafts(prev => ({ ...prev, [`${shared.share_id}-${project.id}`]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const title = (projectTaskDrafts[`${shared.share_id}-${project.id}`] ?? '').trim();
                                  if (title) {
                                    updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, tasks: [...(p.tasks || []), createTaskNode(title)] }));
                                    setProjectTaskDrafts(prev => ({ ...prev, [`${shared.share_id}-${project.id}`]: '' }));
                                  }
                                }
                              }}
                              placeholder="Add task... (Enter)"
                              className="seamless-input text-sm text-zinc-500 dark:text-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                            />
                          </div>
                        </>
                      )}
                    />
                    </div>
                  );
                });
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
