import React from 'react';
import { useToast } from '../../context/ToastContext';

/**
 * Draggable wrapper for a single project card (normal or shared).
 * Handles drag payload and drop reorder; children is typically StandardProjectCard.
 */
export function ProjectCard({ dragPayload, onDrop, children, className = 'cursor-grab active:cursor-grabbing rounded-xl' }) {
  const showToast = useToast();

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
          const validTypes = ['project', 'project-task'];
          if (!validTypes.includes(p.type)) {
            showToast?.('Puoi trascinare solo progetti o task qui', { type: 'warning' });
            return;
          }
          onDrop(p);
        } catch (err) {
          console.error('Drop error:', err);
          showToast?.('Errore durante il trascinamento', { type: 'error' });
        }
      }}
      className={className}
    >
      {children}
    </div>
  );
}
