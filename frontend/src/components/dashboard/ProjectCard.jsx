import React from 'react';

/**
 * Draggable wrapper for a single project card (normal or shared).
 * Handles drag payload and drop reorder; children is typically StandardProjectCard.
 */
export function ProjectCard({ dragPayload, onDrop, children, className = 'cursor-grab active:cursor-grabbing rounded-xl' }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(dragPayload));
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add('ring-2', 'ring-indigo-400');
      }}
      onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-indigo-400')}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('ring-2', 'ring-indigo-400');
        try {
          const p = JSON.parse(e.dataTransfer.getData('application/json'));
          onDrop(p);
        } catch (_) {}
      }}
      className={className}
    >
      {children}
    </div>
  );
}
