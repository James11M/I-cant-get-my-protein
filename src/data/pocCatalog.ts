export type ExerciseDefinition = {
  id: string;
  name: string;
  group: string;
  equipment: 'bodyweight' | 'dumbbell' | 'kettlebell' | 'homegym' | 'fullgym';
  inputType: 'reps' | 'time';
  icon: string;
  defaultSets: number;
  defaultReps?: number;
  defaultSeconds?: number;
  secondsPerRep?: number;
};

const bodyweightRows: Array<[string, string, string, 'reps' | 'time', string]> = [
  ['pushup', 'Push-Up', 'Upper Body', 'reps', '💪'],
  ['squat', 'Bodyweight Squat', 'Lower Body', 'reps', '🦵'],
  ['plank', 'Front Plank', 'Core', 'time', '◎'],
  ['reverseLunge', 'Reverse Lunge', 'Lower Body', 'reps', '🦵'],
  ['gluteBridge', 'Glute Bridge', 'Lower Body', 'reps', '🦵'],
  ['mountainClimber', 'Mountain Climbers', 'Conditioning', 'reps', '◆'],
  ['burpee', 'Burpee', 'Conditioning', 'reps', '◆'],
  ['pullup', 'Pull-Up', 'Upper Body', 'reps', '↔'],
  ['sidePlank', 'Side Plank', 'Core', 'time', '◎'],
  ['jumpSquat', 'Jump Squat', 'Power', 'reps', '🦵'],
  ['sumoSquat', 'Sumo Squat', 'Lower Body', 'reps', '🦵'],
  ['forwardLunge', 'Forward Lunge', 'Lower Body', 'reps', '🦵'],
  ['walkingLunge', 'Walking Lunge', 'Lower Body', 'reps', '🦵'],
  ['lateralLunge', 'Lateral Lunge', 'Lower Body', 'reps', '🦵'],
  ['splitSquat', 'Split Squat', 'Lower Body', 'reps', '🦵'],
  ['bulgarianSplitSquat', 'Bulgarian Split Squat', 'Lower Body', 'reps', '🦵'],
  ['stepUp', 'Step-Up', 'Lower Body', 'reps', '🪜'],
  ['singleLegRDL', 'Single-Leg Romanian Deadlift', 'Lower Body', 'reps', '🦵'],
  ['goodMorning', 'Bodyweight Good Morning', 'Lower Body', 'reps', '↔'],
  ['wallSit', 'Wall Sit', 'Lower Body', 'time', '🦵'],
  ['calfRaise', 'Standing Calf Raise', 'Lower Body', 'reps', '🦵'],
  ['kneePushup', 'Knee Push-Up', 'Upper Body', 'reps', '▰'],
  ['inclinePushup', 'Incline Push-Up', 'Upper Body', 'reps', '▰'],
  ['diamondPushup', 'Diamond Push-Up', 'Upper Body', 'reps', '💪'],
  ['pikePushup', 'Pike Push-Up', 'Upper Body', 'reps', '⬆'],
  ['shoulderTap', 'Plank Shoulder Tap', 'Core', 'reps', '◎'],
  ['plankUp', 'Plank Up', 'Core', 'reps', '◎'],
  ['chinup', 'Chin-Up', 'Upper Body', 'reps', '↔'],
  ['assistedPullup', 'Assisted Pull-Up', 'Upper Body', 'reps', '↔'],
  ['deadHang', 'Dead Hang', 'Upper Body', 'time', '↔'],
  ['deadBug', 'Dead Bug', 'Core', 'reps', '◎'],
  ['hollowHold', 'Hollow Body Hold', 'Core', 'time', '◎'],
  ['bicycleCrunch', 'Bicycle Crunch', 'Core', 'reps', '◎'],
  ['reverseCrunch', 'Reverse Crunch', 'Core', 'reps', '◎'],
  ['russianTwist', 'Russian Twist', 'Core', 'reps', '🔄'],
  ['legRaise', 'Lying Leg Raise', 'Core', 'reps', '◎'],
  ['birdDog', 'Bird Dog', 'Core', 'reps', '◎'],
  ['superman', 'Superman', 'Core', 'time', '↔'],
  ['squatThrust', 'Squat Thrust', 'Conditioning', 'reps', '◆'],
  ['highKnees', 'High Knees', 'Conditioning', 'time', '◆'],
  ['jumpingJack', 'Jumping Jacks', 'Conditioning', 'reps', '◆'],
  ['bearCrawl', 'Bear Crawl', 'Conditioning', 'time', '◆'],
];

function secondsPerRep(id: string) {
  if (id === 'burpee') return 6;
  if (id === 'mountainClimber' || id === 'jumpingJack') return 2;
  if (id === 'squatThrust') return 4;
  if (id === 'pullup' || id === 'chinup') return 5;
  return 3;
}

export const POC_EXERCISES: ExerciseDefinition[] = [
  ...bodyweightRows.map(([id, name, group, inputType, icon]) => ({
    id, name, group, inputType, icon,
    equipment: 'bodyweight' as const,
    defaultSets: 3,
    ...(inputType === 'reps' ? { defaultReps: 10, secondsPerRep: secondsPerRep(id) } : { defaultSeconds: 45 }),
  })),
  { id: 'dbGoblet', name: 'Dumbbell Goblet Squat', group: 'Lower Body', equipment: 'dumbbell', inputType: 'reps', icon: '🦵', defaultSets: 3, defaultReps: 10, secondsPerRep: 4 },
  { id: 'dbRow', name: 'One-Arm Dumbbell Row', group: 'Upper Body', equipment: 'dumbbell', inputType: 'reps', icon: '↔', defaultSets: 3, defaultReps: 10, secondsPerRep: 4 },
  { id: 'dbPress', name: 'Dumbbell Shoulder Press', group: 'Upper Body', equipment: 'dumbbell', inputType: 'reps', icon: '⬆', defaultSets: 3, defaultReps: 10, secondsPerRep: 4 },
  { id: 'dbChestPress', name: 'Dumbbell Chest Press', group: 'Upper Body', equipment: 'dumbbell', inputType: 'reps', icon: '▰', defaultSets: 3, defaultReps: 10, secondsPerRep: 4 },
  { id: 'dbRDL', name: 'Dumbbell Romanian Deadlift', group: 'Lower Body', equipment: 'dumbbell', inputType: 'reps', icon: '🦵', defaultSets: 3, defaultReps: 10, secondsPerRep: 4 },
  { id: 'kbSwing', name: 'Kettlebell Swing', group: 'Power', equipment: 'kettlebell', inputType: 'reps', icon: '⚡', defaultSets: 3, defaultReps: 15, secondsPerRep: 3 },
  { id: 'kbGoblet', name: 'Kettlebell Goblet Squat', group: 'Lower Body', equipment: 'kettlebell', inputType: 'reps', icon: '🦵', defaultSets: 3, defaultReps: 10, secondsPerRep: 4 },
  { id: 'cableRow', name: 'Cable Row', group: 'Upper Body', equipment: 'fullgym', inputType: 'reps', icon: '↔', defaultSets: 3, defaultReps: 10, secondsPerRep: 4 },
  { id: 'legPress', name: 'Leg Press', group: 'Lower Body', equipment: 'fullgym', inputType: 'reps', icon: '🦵', defaultSets: 3, defaultReps: 10, secondsPerRep: 4 },
  { id: 'latPulldown', name: 'Lat Pulldown', group: 'Upper Body', equipment: 'fullgym', inputType: 'reps', icon: '↔', defaultSets: 3, defaultReps: 10, secondsPerRep: 4 },
];

export const POC_ACTIVITIES = [
  ['🏫', 'PE Lesson', 'School / PE', '30 min'],
  ['🏉', 'Rugby', 'Sport', '30 min'],
  ['⚽', 'Football', 'Sport', '30 min'],
  ['🏃', 'Running', 'Cardio', '2 km'],
  ['🏊', 'Swimming', 'Cardio', '500 m'],
  ['🎾', 'Tennis', 'Sport', '30 min'],
  ['🏑', 'Hockey', 'Sport', '30 min'],
  ['🚴', 'Cycling', 'Cardio', '30 min'],
  ['🏀', 'Basketball', 'Sport', '30 min'],
  ['🚣', 'Rowing', 'Cardio', '20 min'],
  ['🏸', 'Badminton', 'Sport', '30 min'],
  ['🏏', 'Cricket', 'Sport', '45 min'],
  ['⛳', 'Golf', 'Sport', '9 holes'],
  ['🥾', 'Walk / Hike', 'Recovery', '45 min'],
  ['🧘', 'Mobility / Stretching', 'Recovery', '20 min'],
] as const;

export const EQUIPMENT_LABELS: Record<ExerciseDefinition['equipment'], string> = {
  bodyweight: 'BODYWEIGHT',
  dumbbell: 'DUMBBELLS',
  kettlebell: 'KETTLEBELLS',
  homegym: 'HOME KIT',
  fullgym: 'FULL GYM',
};
