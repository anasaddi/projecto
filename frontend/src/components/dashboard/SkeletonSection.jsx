import React from 'react';

const SkeletonBase = ({ className }) => (
  <div className={`animate-pulse rounded bg-zinc-200 dark:bg-zinc-800/50 ${className}`} />
);

export const HabitSkeleton = () => (
  <div className="dashboard-panel flex flex-col gap-3 p-4">
    <div className="flex justify-between items-center mb-2">
      <SkeletonBase className="h-5 w-24" />
      <SkeletonBase className="h-4 w-10" />
    </div>
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="flex gap-2 items-center">
        <SkeletonBase className="h-5 w-5 rounded-md" />
        <SkeletonBase className="h-4 flex-1" />
      </div>
    ))}
  </div>
);

export const ProjectSkeleton = () => (
  <div className="dashboard-panel flex flex-col gap-4 p-4 md:col-span-2 lg:col-span-6">
    <div className="flex justify-between items-center mb-2">
      <SkeletonBase className="h-6 w-32" />
      <SkeletonBase className="h-7 w-16" />
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      {[1, 2].map(i => (
        <div key={i} className="rounded-xl border border-zinc-100 dark:border-white/5 p-4 space-y-3">
          <div className="flex justify-between">
            <SkeletonBase className="h-5 w-24" />
            <SkeletonBase className="h-4 w-8" />
          </div>
          <SkeletonBase className="h-2 w-full" />
          <div className="space-y-2">
            <SkeletonBase className="h-4 w-3/4" />
            <SkeletonBase className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const Top3Skeleton = () => (
  <div className="dashboard-panel p-4 space-y-4">
    <SkeletonBase className="h-5 w-28" />
    {[1, 2, 3].map(i => (
      <SkeletonBase key={i} className="h-14 w-full rounded-xl" />
    ))}
  </div>
);

export const QuickTaskSkeleton = () => (
  <div className="dashboard-panel p-4 space-y-3">
    <SkeletonBase className="h-5 w-24" />
    <SkeletonBase className="h-9 w-full rounded-lg" />
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="flex gap-2 items-center">
        <SkeletonBase className="h-5 w-5" />
        <SkeletonBase className="h-4 flex-1" />
      </div>
    ))}
  </div>
);
