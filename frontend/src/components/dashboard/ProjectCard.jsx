import React from 'react';
import { useToast } from '../../context/ToastContext';
import { parseDragPayload, setDragPayload } from '../../utils/dragPayload';

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
        setDragPayload(e.dataTransfer, dragPayload);
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
          const p = parseDragPayload(e.dataTransfer);
          if (!p) return;
          const validTypes = ['project', 'project-task', 'quick', 'sharedProject'];
          if (!validTypes.includes(p.type)) {
            showToast?.('Elemento non valido per questa posizione', { type: 'warning' });
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
