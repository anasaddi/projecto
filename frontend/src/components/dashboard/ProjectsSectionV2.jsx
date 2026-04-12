import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from './Icons';
import { StandardProjectCard, CreateProjectCard } from './ProjectComponents';
import { ProjectCard } from './ProjectCard';
import { DenseTaskNode } from './DenseTaskNode';
import { createTaskNode, updateNodeInTree, countTreeStats, getDeadlineColorClass, formatDeadline } from './DashboardUtils';
import { useDashboardStore } from '../../store/dashboardStore';
import { Card, CardHeader, CardBody, Badge } from '../ui/CardV2';
import { Heading, Text, Label } from '../ui/Typography';
import { AddItemInputBar } from './AddItemInputBar';

export function ProjectsSectionV2({ PROJECT_ACCENTS }) {
  const projects = useDashboardStore((s) => s.projects) ?? [];
  const createProject = useDashboardStore((s) => s.createProject);
  const setConfirmState = useDashboardStore((s) => s.setConfirmState);
  const reorderProjects = useDashboardStore((s) => s.reorderProjects);
  const reorderSharedDashboardProjects = useDashboardStore((s) => s.reorderSharedDashboardProjects);
  const updateProject = useDashboardStore((s) => s.updateProject);
  const syncPersonalProjectToShared = useDashboardStore((s) => s.syncPersonalProjectToShared);
  const projectTaskDrafts = useDashboardStore((s) => s.projectTaskDrafts) ?? {};
  const setProjectTaskDrafts = useDashboardStore((s) => s.setProjectTaskDrafts);
  const projectDeadlineEditing = useDashboardStore((s) => s.projectDeadlineEditing);
  const projectDeadlineInput = useDashboardStore((s) => s.projectDeadlineInput);
  const setProjectDeadlineInput = useDashboardStore((s) => s.setProjectDeadlineInput);
  const setProjectDeadlineEditing = useDashboardStore((s) => s.setProjectDeadlineEditing);
  const sharedDashboards = useDashboardStore((s) => s.sharedDashboards) ?? [];
  const updateSharedDashboardProject = useDashboardStore((s) => s.updateSharedDashboardProject);
  const deleteSharedDashboardProject = useDashboardStore((s) => s.deleteSharedDashboardProject);

  const hasProjects = projects.length > 0;
  const hasShared = sharedDashboards.length > 0;
  const allCompleted = hasProjects && projects.every(p => countTreeStats(p.tasks).ratio === 1);

  return (
    <Card 
      variant="elevated" 
      radius="xl" 
      className="flex flex-col min-h-0"
      glow={allCompleted}
      glowColor="success"
    >
      <CardHeader
        icon={<Icons.Square className="w-5 h-5" />}
        iconColor="text-indigo-500"
        title="Progetti"
        subtitle={hasProjects ? `${projects.length} progetti attivi` : 'Crea il tuo primo progetto'}
        bordered={true}
      />

      <CardBody className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {!hasProjects ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <CreateProjectCard onClick={createProject} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Personal Projects */}
            <div className="flex flex-col gap-4">
              {projects.map((project, idx) => {
                const actualStats = countTreeStats(project.tasks);
                const percentage = Math.round(actualStats.ratio * 100);
                const accent = PROJECT_ACCENTS[idx % PROJECT_ACCENTS.length];
                
                // Create sync menu items for each shared dashboard
                const syncMenuItems = sharedDashboards.length > 0
                  ? [
                      'divider',
                      {
                        label: 'Sincronizza con...',
                        icon: <Icons.Share2 className="h-3.5 w-3.5" />,
                        disabled: true,
                        isHeader: true,
                      },
                      ...sharedDashboards.map((sd) => ({
                        label: sd.title || 'Dashboard Condivisa',
                        icon: <Icons.Users className="h-3.5 w-3.5" />,
                        onClick: () => syncPersonalProjectToShared(project.id, sd.share_id),
                      })),
                    ]
                  : [];
                
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
                      extraMenuItems={syncMenuItems}
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
                              showWorkingByBadge={false}
                            />
                          ))}
                          <div className="pt-2">
                            <AddItemInputBar
                              value={projectTaskDrafts[project.id] ?? ''}
                              onChange={(val) => setProjectTaskDrafts(prev => ({ ...prev, [project.id]: val }))}
                              onSubmit={() => {
                                const title = (projectTaskDrafts[project.id] ?? '').trim();
                                if (title) {
                                  updateProject(project.id, p => ({ ...p, tasks: [...(p.tasks || []), createTaskNode(title)] }));
                                  setProjectTaskDrafts(prev => ({ ...prev, [project.id]: '' }));
                                }
                              }}
                              placeholder="Aggiungi task..."
                              buttonColor="indigo"
                            />
                          </div>
                        </>
                      )}
                    />
                  </ProjectCard>
                );
              })}
              
              <div className="flex min-h-[5.5rem]">
                <CreateProjectCard onClick={createProject} className="flex-1" />
              </div>
            </div>

            {/* Shared Projects */}
            {hasShared && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 py-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/10">
                      <Icons.MessageCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <Label>Condivisi</Label>
                  </div>
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                </div>
                              
                <div className="flex flex-col gap-4">
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
                            sourceProjectId={project.sourceProjectId}
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
                                    showWorkingByBadge={false}
                                  />
                                ))}
                                <div className="pt-2">
                                  <AddItemInputBar
                                    value={projectTaskDrafts[`${shared.share_id}-${project.id}`] ?? ''}
                                    onChange={(val) => setProjectTaskDrafts(prev => ({ ...prev, [`${shared.share_id}-${project.id}`]: val }))}
                                    onSubmit={() => {
                                      const title = (projectTaskDrafts[`${shared.share_id}-${project.id}`] ?? '').trim();
                                      if (title) {
                                        updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, tasks: [...(p.tasks || []), createTaskNode(title)] }));
                                        setProjectTaskDrafts(prev => ({ ...prev, [`${shared.share_id}-${project.id}`]: '' }));
                                      }
                                    }}
                                    placeholder="Aggiungi task..."
                                    buttonColor="indigo"
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
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default ProjectsSectionV2;
