import React from 'react';
import { ModernInput, ModernCheckbox } from './TrainingUI';

const COMPACT_INPUT = 'w-9 h-7 py-0 text-[11px]';
const COMPACT_INPUT_SM = 'w-7 h-7 py-0 text-[11px]';

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
      <div className={`flex items-center gap-0.5 justify-center ${className}`}>
        <ModernInput
          type="text"
          value={values[`${prefix}_sx`] ?? ''}
          onChange={v => onChange(`${prefix}_sx`, v)}
          className={`${COMPACT_INPUT} ${className}`}
          placeholder="sx"
        />
        <ModernInput
          type="text"
          value={values[`${prefix}_dx`] ?? ''}
          onChange={v => onChange(`${prefix}_dx`, v)}
          className={`${COMPACT_INPUT} ${className}`}
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
      <div className={`flex items-center gap-0.5 justify-center ${className}`}>
        <ModernInput
          type="text"
          value={values.weight ?? ''}
          onChange={v => onChange('weight', v)}
          className={COMPACT_INPUT}
          placeholder="kg"
        />
        <ModernInput
          type="text"
          value={values.secs ?? ''}
          onChange={v => onChange('secs', v)}
          className={COMPACT_INPUT_SM}
          placeholder="sec"
        />
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
      <div className={`flex items-center gap-0.5 justify-center ${className}`}>
        <ModernInput
          type="text"
          value={values.weight ?? ''}
          onChange={v => onChange('weight', v)}
          className={`${COMPACT_INPUT} ${className}`}
          placeholder="kg"
        />
        <ModernCheckbox
          checked={!!values.completed}
          onChange={() => onChange('completed', !values.completed)}
          colorClass={accent}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-0.5 justify-center ${className}`}>
      <ModernInput
        type="text"
        value={values.weight ?? ''}
        onChange={v => onChange('weight', v)}
        className={COMPACT_INPUT}
        placeholder="kg"
      />
      <ModernInput
        type="text"
        value={values.reps ?? ''}
        onChange={v => onChange('reps', v)}
        className={COMPACT_INPUT_SM}
        placeholder="r"
      />
      <ModernCheckbox
        checked={!!values.completed}
        onChange={() => onChange('completed', !values.completed)}
        colorClass={accent}
      />
    </div>
  );
}

export function AthleteHeader({ className = '' }) {
  return (
    <>
      <th className={`py-2 px-2 text-center text-blue-500 ${className}`}>Anas (kg/r)</th>
      <th className={`py-2 px-2 text-center text-emerald-500 ${className}`}>Flavio (kg/r)</th>
    </>
  );
}
