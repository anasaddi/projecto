import React from 'react';
import { Icons } from './Icons';
import { StandardProjectCard } from './ProjectComponents';
import { ProjectCard } from './ProjectCard';
import { DenseTaskNode } from './DenseTaskNode';
import { createTaskNode, updateNodeInTree, countTreeStats, getDeadlineColorClass, formatDeadline } from './DashboardUtils';
import { useDashboardStore } from '../../store/dashboardStore';

export function ProjectsSection({ PROJECT_ACCENTS }) {
  const projects = useDashboardStore((s) => s.projects) ?? [];
  const createProject = useDashboardStore((s) => s.createProject);
  const setConfirmState = useDashboardStore((s) => s.setConfirmState);
  const reorderProjects = useDashboardStore((s) => s.reorderProjects);
  const reorderSharedDashboardProjects = useDashboardStore((s) => s.reorderSharedDashboardProjects);
  const updateProject = useDashboardStore((s) => s.updateProject);
  const projectTaskDrafts = useDashboardStore((s) => s.projectTaskDrafts) ?? {};
  const setProjectTaskDrafts = useDashboardStore((s) => s.setProjectTaskDrafts);
  const projectDeadlineEditing = useDashboardStore((s) => s.projectDeadlineEditing);
  const projectDeadlineInput = useDashboardStore((s) => s.projectDeadlineInput);
  const setProjectDeadlineInput = useDashboardStore((s) => s.setProjectDeadlineInput);
  const setProjectDeadlineEditing = useDashboardStore((s) => s.setProjectDeadlineEditing);
  const sharedDashboards = useDashboardStore((s) => s.sharedDashboards) ?? [];
  const updateSharedDashboardProject = useDashboardStore((s) => s.updateSharedDashboardProject);
  const deleteSharedDashboardProject = useDashboardStore((s) => s.deleteSharedDashboardProject);

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
          <Icons.Plus className="h-3.5 w-3.5" />
          <span>Nuovo</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-8 px-4 rounded-xl border-2 border-dashed border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]">
            <span className="text-2xl text-indigo-300 dark:text-indigo-600">□</span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-center">Nessun progetto</span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center">Clicca &quot;Nuovo&quot; per crearne uno</span>
          </div>
        ) : (
        <>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {projects.map((project, idx) => {
            const actualStats = countTreeStats(project.tasks);
            const percentage = Math.round(actualStats.ratio * 100);
            const accent = PROJECT_ACCENTS[idx % PROJECT_ACCENTS.length];
            return (
              <ProjectCard
                key={project.id}
                dragPayload={{ type: 'project', fromIndex: idx }}
                onDrop={(p) => { if (p.type === 'project') reorderProjects(p.fromIndex, idx); }}
              >
              <StandardProjectCard
                project={project}
                stats={actualStats}
                percentage={percentage}
                accent={accent}
                isShared={false}
                onTitleChange={(val) => updateProject(project.id, p => ({ ...p, title: val }))}
                onDelete={() => setConfirmState?.({ id: 'deleteProject', payload: { projectId: project.id } })}
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
                        key={node.id}
                        node={node}
                        depth={0}
                        projectId={project.id}
                        projectAccent={accent}
                        targetIndex={tIdx}
                        targetParentId={null}
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
                        placeholder="Aggiungi task... (Invio)"
                        className="seamless-input text-sm text-zinc-500 dark:text-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                      />
                    </div>
                  </>
                )}
                    />
              </ProjectCard>
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
                  const actualStats = countTreeStats(project.tasks);
                  const percentage = Math.round(actualStats.ratio * 100);
                  const accent = PROJECT_ACCENTS[(sIdx + pIdx + projects.length) % PROJECT_ACCENTS.length];

                  return (
                    <ProjectCard
                      key={`${shared.share_id}-${project.id}`}
                      dragPayload={{ type: 'sharedProject', shareId: shared.share_id, fromIndex: pIdx }}
                      onDrop={(p) => { if (p.type === 'sharedProject' && p.shareId === shared.share_id) reorderSharedDashboardProjects(p.shareId, p.fromIndex, pIdx); }}
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
                              key={node.id}
                              node={node}
                              depth={0}
                              projectId={project.id}
                              projectAccent={accent}
                              shareId={shared.share_id}
                              targetIndex={tIdx}
                              targetParentId={null}
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
                              placeholder="Aggiungi task... (Invio)"
                              className="seamless-input text-sm text-zinc-500 dark:text-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                            />
                          </div>
                        </>
                      )}
                    />
                    </ProjectCard>
                  );
                });
              })}
            </div>
          </div>
        )}
        </>
      ) }
      </div>
    </div>
  );
}
