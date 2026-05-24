// Epley Formula
export const calc1RM = (weight, reps) => {
  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  if (!w || !r) return null;
  if (r === 1) return w;
  return w * (1 + r / 35);
};

export const sanitizeProgressionData = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  const sanitized = { ...data };
  
  // Validate dataByMonth is an array of arrays
  if (!Array.isArray(sanitized.dataByMonth)) {
    sanitized.dataByMonth = [];
  } else {
    // Ensure each month is an array and contains objects (not primitives)
    sanitized.dataByMonth = sanitized.dataByMonth.map(month => {
      if (!Array.isArray(month)) return [];
      // Filter out non-object entries
      return month.filter(week => week && typeof week === 'object' && !Array.isArray(week));
    });
  }
  
  if (!Array.isArray(sanitized.tmByMonth)) sanitized.tmByMonth = [];
  return sanitized;
};

// Helper to find the active month (1-6) for a progression
export const getActiveMonth = (progressionData) => {
  const sanitized = sanitizeProgressionData(progressionData);
  if (!sanitized.dataByMonth || sanitized.dataByMonth.length === 0) return 1;
  
  const dataByMonth = sanitized.dataByMonth;
  let activeMonthIdx = [...dataByMonth].reverse().findIndex(m => 
    Array.isArray(m) && m.some(r => r?.anas?.completed || r?.flavio?.completed)
  );
  
  if (activeMonthIdx !== -1) {
    activeMonthIdx = (dataByMonth.length - 1) - activeMonthIdx;
    
    const currentMonth = dataByMonth[activeMonthIdx];
    if (Array.isArray(currentMonth)) {
      const lastCheckedIdx = [...currentMonth].reverse().findIndex(row => row?.anas?.completed || row?.flavio?.completed);
      let activeWeekIdx = -1;
      
      if (lastCheckedIdx !== -1) {
        const realLastIdx = (currentMonth.length - 1) - lastCheckedIdx;
        activeWeekIdx = realLastIdx + 1;
      } else {
        activeWeekIdx = 0;
      }
      
      if (activeWeekIdx >= currentMonth.length && activeMonthIdx < dataByMonth.length - 1) {
        activeMonthIdx++;
      }
    }
    return activeMonthIdx + 1;
  }
  
  return 1;
};

// Helper to find the active week (1-5) for AW progressions
export const getActiveWeek = (progressionData, exerciseId) => {
  if (!progressionData || typeof progressionData !== 'object') return 1;
  
  let maxWeek = 0;
  try {
    Object.keys(progressionData).forEach(key => {
      if (key.startsWith('w')) {
        const parts = key.substring(1).split('_');
        const w = parseInt(parts[0]);
        if (!isNaN(w) && (progressionData[key]?.anas?.completed || progressionData[key]?.flavio?.completed)) {
          if (w > maxWeek) maxWeek = w;
        }
      }
    });
  } catch (e) {
    console.warn("Error parsing active week for", exerciseId, e);
    return 1;
  }

  if (maxWeek === 0) return 1;
  return Math.min(maxWeek, 5); 
};

const getTemplateId = (t) => t?.template_id ?? t?.id ?? null;

const restTemplateForDay = (day) => {
  const raw = (day?.date || day?.date_ || '').toString().slice(0, 10);
  const weekday = raw ? new Date(`${raw}T12:00:00`).getDay() : 0;
  return { exercises: [], day_name: 'Riposo', weekday, template_id: null };
};

/** Merge schedule rows with workout templates; infer template when template_id is null. */
export const mergeScheduleWithTemplates = (scheduleDays, templates) => {
  if (!templates?.length) {
    return (scheduleDays || []).map(day => ({
      ...day,
      template_id: day.template_id ?? null,
      template: restTemplateForDay(day),
    }));
  }

  let prevTemplateIdx = -1;
  const effectiveTemplateIds = (scheduleDays || []).map((day) => {
    if (day.template_id) {
      const idx = templates.findIndex(t => getTemplateId(t) === day.template_id);
      if (idx >= 0) prevTemplateIdx = idx;
      return day.template_id;
    }
    if (day.is_completed) return null;
    const nextIdx = prevTemplateIdx >= 0 ? (prevTemplateIdx + 1) % templates.length : 0;
    prevTemplateIdx = nextIdx;
    return getTemplateId(templates[nextIdx]);
  });

  return (scheduleDays || []).map((day, i) => {
    const tid = effectiveTemplateIds[i];
    const template = tid
      ? templates.find(t => getTemplateId(t) === tid) || restTemplateForDay(day)
      : restTemplateForDay(day);
    return { ...day, template_id: tid, template };
  });
};
