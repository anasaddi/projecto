import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timeoutRef = React.useRef(null);

  const showToast = useCallback((message, typeOrOptions = 'default') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const normalizedType =
      typeof typeOrOptions === 'string'
        ? typeOrOptions
        : (typeOrOptions && typeof typeOrOptions === 'object' && typeOrOptions.type) || 'default';
    setToast({ message, type: normalizedType });
    timeoutRef.current = setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-xl shadow-lg border border-zinc-200/80 dark:border-white/10 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md text-sm font-medium text-zinc-800 dark:text-zinc-100 animate-slide-up"
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx || (() => {});
}
