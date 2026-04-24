import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { CardV3 } from '../ui/CardV3';
import { ButtonV3 } from '../ui/ButtonV3';
import { ProgressRing } from '../ui/ProgressRing';

interface PomodoroV3Props {
  initialMinutes?: number;
}

const PRESETS = [
  { label: '25', minutes: 25, color: '#6366f1' },
  { label: '50', minutes: 50, color: '#8b5cf6' },
  { label: 'Break', minutes: 5, color: '#22c55e' },
];

export const PomodoroV3 = memo(function PomodoroV3({ initialMinutes = 25 }: PomodoroV3Props) {
  const [duration, setDuration] = useState(initialMinutes * 60);
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const progress = useMemo(() => {
    if (duration === 0) return 0;
    return (duration - timeLeft) / duration;
  }, [duration, timeLeft]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setSessions((s) => s + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleStart = useCallback(() => setIsRunning(true), []);
  const handlePause = useCallback(() => setIsRunning(false), []);
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(duration);
  }, [duration]);

  const handlePreset = useCallback((minutes: number) => {
    const newDuration = minutes * 60;
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setIsRunning(false);
  }, []);

  return (
    <CardV3 className="h-full">
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-sm font-medium text-[var(--d3-text-muted)] uppercase tracking-wider">
          Focus Timer
        </h3>
        
        <ProgressRing 
          progress={progress} 
          size={140} 
          strokeWidth={6}
          color={isRunning ? 'var(--d3-primary)' : 'var(--d3-text-muted)'}
        >
          <div className="text-center">
            <div className="text-3xl font-semibold text-[var(--d3-text)] tabular-nums">
              {formatTime(timeLeft)}
            </div>
            <div className="text-xs text-[var(--d3-text-muted)] mt-1">
              {sessions} sessions
            </div>
          </div>
        </ProgressRing>

        <div className="flex gap-2">
          {!isRunning ? (
            <ButtonV3 variant="primary" size="md" onClick={handleStart}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Start
            </ButtonV3>
          ) : (
            <ButtonV3 variant="secondary" size="md" onClick={handlePause}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Pause
            </ButtonV3>
          )}
          <ButtonV3 variant="ghost" size="md" onClick={handleReset}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </ButtonV3>
        </div>

        <div className="flex gap-2 pt-2 border-t border-[var(--d3-border)] w-full justify-center">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset.minutes)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                duration === preset.minutes * 60
                  ? 'bg-[var(--d3-primary)] text-white'
                  : 'bg-[var(--d3-surface-elevated)] text-[var(--d3-text-secondary)] hover:bg-[var(--d3-border)]'
              }`}
            >
              {preset.label}m
            </button>
          ))}
        </div>
      </div>
    </CardV3>
  );
});
