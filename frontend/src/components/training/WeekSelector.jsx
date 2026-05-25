import React from 'react';
import { PeriodPills } from './TrainingUI';

export default function WeekSelector({
  weeks = 5,
  current,
  onChange,
  cycleDividers = false,
  compact = false,
  className = '',
}) {
  return (
    <PeriodPills
      accent="aw"
      count={weeks}
      current={current}
      onChange={onChange}
      cycleDividers={cycleDividers}
      compact={compact}
      className={className}
    />
  );
}
