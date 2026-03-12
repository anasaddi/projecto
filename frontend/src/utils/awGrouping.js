const AW_CONFIG = {
  volume1: ["aw_v1", "volume 1", "vol. 1", "v1"],
  volume2: ["aw_v2", "volume 2", "vol. 2", "v2"],
  isoKeywords: ["rising", "cup", "cupping", "pronation", "side", "mazurenko", "press", "bicipite", "isometria", "iso"],
  lightKeywords: ["light", "leggera", "leggero"],
  heavyKeywords: ["heavy", "pesante"],
};

const toText = (value) => (value || "").toString().toLowerCase();

const hasAny = (text, keywords) => keywords.some((k) => text.includes(k));

const getExerciseText = (exercise) => {
  const id = toText(exercise?.exercise_id);
  const name = toText(exercise?.exercise_name);
  return `${id} ${name}`.trim();
};

const isVolume1 = (exercise) => hasAny(getExerciseText(exercise), AW_CONFIG.volume1);
const isVolume2 = (exercise) => hasAny(getExerciseText(exercise), AW_CONFIG.volume2);
const isIso = (exercise) => hasAny(getExerciseText(exercise), AW_CONFIG.isoKeywords);
const isLight = (exercise) => hasAny(getExerciseText(exercise), AW_CONFIG.lightKeywords);
const isHeavy = (exercise) => hasAny(getExerciseText(exercise), AW_CONFIG.heavyKeywords);

const isMaxDay = (exercise) => {
  const text = getExerciseText(exercise);
  return text.includes('aw_max') || text.includes('max day') || text.includes('maxday');
};

const isSpeed = (exercise) => {
  const text = getExerciseText(exercise);
  return text.includes('aw_speed') || text.includes('speed');
};

export const groupAwExercises = (awExercises = []) => {
  const vol1 = awExercises.filter(isVolume1);
  const vol2 = awExercises.filter(isVolume2);
  const isoLight = awExercises.filter((ex) => !isVolume1(ex) && !isVolume2(ex) && isIso(ex) && isLight(ex) && !isHeavy(ex));
  const isoHeavy = awExercises.filter((ex) => !isVolume1(ex) && !isVolume2(ex) && isIso(ex) && isHeavy(ex));
  const maxDay = awExercises.filter((ex) => !vol1.includes(ex) && !vol2.includes(ex) && !isoLight.includes(ex) && !isoHeavy.includes(ex) && isMaxDay(ex));
  const speed = awExercises.filter((ex) => !vol1.includes(ex) && !vol2.includes(ex) && !isoLight.includes(ex) && !isoHeavy.includes(ex) && !maxDay.includes(ex) && isSpeed(ex));
  const others = awExercises.filter((ex) => !vol1.includes(ex) && !vol2.includes(ex) && !isoLight.includes(ex) && !isoHeavy.includes(ex) && !maxDay.includes(ex) && !speed.includes(ex));

  return { vol1, vol2, isoLight, isoHeavy, maxDay, speed, others };
};

