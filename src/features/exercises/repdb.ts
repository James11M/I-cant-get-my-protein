import { ExerciseDefinition } from '@/data/pocCatalog';

const REPDB_URL = 'https://exercise-dataset.com/exercises.json';
const REPDB_BASE = 'https://exercise-dataset.com/';

export type VisualExercise = ExerciseDefinition & {
  imageStart?: string | null;
  imagePeak?: string | null;
  imageMain?: string | null;
  instructions?: string[];
  videoUrl?: string | null;
};

function repImage(path: unknown) {
  if (!path) return null;
  const value = String(path);
  return value.startsWith('http') ? value : `${REPDB_BASE}${value}`;
}

function repVideo(item: any) {
  const candidate = item?.video_url || item?.videoUrl || item?.video || item?.youtube_url || item?.youtube || item?.videos?.[0]?.url;
  if (!candidate) return null;
  const value = String(candidate);
  return /^https?:\/\//i.test(value) ? value : null;
}

function normaliseName(value = '') {
  return value.toLowerCase().replace(/[-_/]/g, ' ').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

function findRepExercise(exercise: ExerciseDefinition, database: any[]) {
  const target = normaliseName(exercise.name);
  return database.find((item) => {
    const name = normaliseName(item?.name_en || item?.name || item?.names?.en || '');
    return name === target || name.includes(target) || target.includes(name);
  }) || null;
}

export async function loadVisualExercises(exercises: ExerciseDefinition[]): Promise<VisualExercise[]> {
  try {
    const response = await fetch(REPDB_URL);
    if (!response.ok) throw new Error('Exercise illustrations unavailable');
    const json = await response.json();
    const database = Array.isArray(json) ? json : Array.isArray(json?.exercises) ? json.exercises : [];
    return exercises.map((exercise) => {
      const matched = findRepExercise(exercise, database);
      const images = matched?.images?.flat || matched?.images || {};
      const rawInstructions = matched?.instructions_en;
      return {
        ...exercise,
        imageStart: repImage(images.start),
        imagePeak: repImage(images.peak),
        imageMain: repImage(images.main),
        instructions: Array.isArray(rawInstructions) ? rawInstructions.map(String) : [],
        videoUrl: repVideo(matched),
      };
    });
  } catch {
    return exercises.map((exercise) => ({ ...exercise, instructions: [], videoUrl: null }));
  }
}
