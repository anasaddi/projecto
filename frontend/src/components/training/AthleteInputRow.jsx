import React from 'react';
import { CompactInput, ModernCheckbox } from './TrainingUI';
import { ATHLETE_CELL } from './trainingTableTheme';

const ACCENTS = {
  anas: 'accent-blue-500',
  flavio: 'accent-emerald-500',
};

export function AthleteCell({
  mode = 'weight-reps',
  values = {},
  onChange,
  athlete = 'anas',
  className = '',
}) {
  const accent = ACCENTS[athlete] || 'accent-indigo-500';

  if (mode === 'sx-dx') {
    const prefix = athlete === 'anas' ? 'anas' : 'flavio';
    return (
      <div className={`${ATHLETE_CELL} ${className}`}>
        <CompactInput
          value={values[`${prefix}_sx`] ?? ''}
          onChange={v => onChange(`${prefix}_sx`, v)}
          className={className}
          placeholder="sx"
        />
        <CompactInput
          value={values[`${prefix}_dx`] ?? ''}
          onChange={v => onChange(`${prefix}_dx`, v)}
          className={className}
          placeholder="dx"
        />
        <ModernCheckbox
          checked={!!values[`${prefix}_completed`]}
          onChange={() => onChange(`${prefix}_completed`, !values[`${prefix}_completed`])}
          colorClass={accent}
        />
      </div>
    );
  }

  if (mode === 'weight-secs') {
    return (
      <div className={`${ATHLETE_CELL} ${className}`}>
        <CompactInput value={values.weight ?? ''} onChange={v => onChange('weight', v)} placeholder="kg" />
        <CompactInput value={values.secs ?? ''} onChange={v => onChange('secs', v)} size="sm" placeholder="sec" />
        <ModernCheckbox
          checked={!!values.completed}
          onChange={() => onChange('completed', !values.completed)}
          colorClass={accent}
        />
      </div>
    );
  }

  if (mode === 'weight-only') {
    return (
      <div className={`${ATHLETE_CELL} ${className}`}>
        <CompactInput value={values.weight ?? ''} onChange={v => onChange('weight', v)} className={className} placeholder="kg" />
        <ModernCheckbox
          checked={!!values.completed}
          onChange={() => onChange('completed', !values.completed)}
          colorClass={accent}
        />
      </div>
    );
  }

  return (
    <div className={`${ATHLETE_CELL} ${className}`}>
      <CompactInput value={values.weight ?? ''} onChange={v => onChange('weight', v)} placeholder="kg" />
      <CompactInput value={values.reps ?? ''} onChange={v => onChange('reps', v)} size="sm" placeholder="r" />
      <ModernCheckbox
        checked={!!values.completed}
        onChange={() => onChange('completed', !values.completed)}
        colorClass={accent}
      />
    </div>
  );
}

export { AthleteColumnHeaders as AthleteHeader } from './TrainingUI';
