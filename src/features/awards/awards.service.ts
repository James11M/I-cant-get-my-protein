import { ActivityLog, getActivityLogs } from '@/features/activities/activity.service';

export type BadgeMode = 'single' | 'cumulative' | 'sessions';
export type BadgeGroup = 'Swimming' | 'Running' | 'Rugby' | 'Strength';

export type BadgeDefinition = {
  id: string;
  group: BadgeGroup;
  family: string;
  icon: string;
  title: string;
  description: string;
  threshold: number;
  unit: 'm' | 'km' | 'min' | 'sessions' | 'days';
  mode: BadgeMode;
  activityName?: string;
  trainingType?: string;
};

export type EvaluatedBadge = BadgeDefinition & {
  earned: boolean;
  earnedAt: string | null;
  progress: number;
};

const swimmingSingle = [200, 400, 800, 1500, 3000, 5000].map((threshold) => ({
  id: `swim-single-${threshold}`,
  group: 'Swimming' as const,
  family: 'ONE SESSION',
  icon: '🏊',
  title: `${threshold}M SWIM`,
  description: `Swim ${threshold.toLocaleString()} metres in one session.`,
  threshold,
  unit: 'm' as const,
  mode: 'single' as const,
  activityName: 'Swimming',
}));

const swimmingLifetime = [5000, 10000, 25000, 50000, 100000, 250000].map((threshold) => ({
  id: `swim-lifetime-${threshold}`,
  group: 'Swimming' as const,
  family: 'TOTAL DISTANCE',
  icon: '🏊',
  title: `${formatKm(threshold)} TOTAL`,
  description: `Swim ${formatKm(threshold).toLowerCase()} in total across all sessions.`,
  threshold,
  unit: 'm' as const,
  mode: 'cumulative' as const,
  activityName: 'Swimming',
}));

const runningSingle = [1000, 2000, 5000, 10000, 21097].map((threshold) => ({
  id: `run-single-${threshold}`,
  group: 'Running' as const,
  family: 'ONE SESSION',
  icon: '🏃',
  title: threshold === 21097 ? 'HALF MARATHON' : `${formatKm(threshold)} RUN`,
  description: `Run ${threshold === 21097 ? 'a half marathon' : formatKm(threshold).toLowerCase()} in one session.`,
  threshold,
  unit: 'm' as const,
  mode: 'single' as const,
  activityName: 'Running',
}));

const runningLifetime = [10000, 25000, 50000, 100000, 250000, 500000].map((threshold) => ({
  id: `run-lifetime-${threshold}`,
  group: 'Running' as const,
  family: 'TOTAL DISTANCE',
  icon: '🏃',
  title: `${formatKm(threshold)} TOTAL`,
  description: `Run ${formatKm(threshold).toLowerCase()} in total.`,
  threshold,
  unit: 'm' as const,
  mode: 'cumulative' as const,
  activityName: 'Running',
}));

const rugbyLifetime = [100, 500, 1000, 2500, 5000, 10000].map((threshold) => ({
  id: `rugby-${threshold}`,
  group: 'Rugby' as const,
  family: 'TOTAL TRAINING',
  icon: '🏉',
  title: `${threshold.toLocaleString()} MIN`,
  description: `Log ${threshold.toLocaleString()} minutes of Rugby in total.`,
  threshold,
  unit: 'min' as const,
  mode: 'cumulative' as const,
  activityName: 'Rugby',
}));

const strengthSessions = [5, 10, 25, 50, 100, 250].map((threshold) => ({
  id: `strength-${threshold}`,
  group: 'Strength' as const,
  family: 'SESSIONS',
  icon: '🏋️',
  title: `${threshold} SESSIONS`,
  description: `Complete ${threshold} Strength Training sessions.`,
  threshold,
  unit: 'sessions' as const,
  mode: 'sessions' as const,
  trainingType: 'Strength',
}));

export const BADGES: BadgeDefinition[] = [
  ...swimmingSingle,
  ...swimmingLifetime,
  ...runningSingle,
  ...runningLifetime,
  ...rugbyLifetime,
  ...strengthSessions,
];

export const BADGE_GROUPS: Array<'All' | BadgeGroup> = ['All', 'Swimming', 'Running', 'Rugby', 'Strength'];

export async function getEvaluatedBadges(): Promise<EvaluatedBadge[]> {
  const logs = await getActivityLogs();
  return evaluateBadges(logs);
}

export function evaluateBadges(logs: ActivityLog[]): EvaluatedBadge[] {
  return BADGES.map((badge) => evaluateBadge(badge, logs));
}

function evaluateBadge(badge: BadgeDefinition, logs: ActivityLog[]): EvaluatedBadge {
  const relevant = logs
    .filter((log) => badge.activityName ? log.activity_name.toLowerCase() === badge.activityName.toLowerCase() : badge.trainingType ? log.training_type === badge.trainingType : true)
    .sort((a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime());

  if (badge.mode === 'sessions') {
    const earnedLog = relevant[badge.threshold - 1];
    return { ...badge, earned: Boolean(earnedLog), earnedAt: earnedLog?.performed_at ?? null, progress: Math.min(relevant.length, badge.threshold) };
  }

  if (badge.mode === 'single') {
    const earnedLog = relevant.find((log) => amountInMetres(log) >= badge.threshold);
    const progress = relevant.reduce((best, log) => Math.max(best, amountInMetres(log)), 0);
    return { ...badge, earned: Boolean(earnedLog), earnedAt: earnedLog?.performed_at ?? null, progress: Math.min(progress, badge.threshold) };
  }

  let cumulative = 0;
  let earnedAt: string | null = null;
  for (const log of relevant) {
    cumulative += badge.unit === 'min' ? Number(log.duration_minutes || 0) : amountInMetres(log);
    if (!earnedAt && cumulative >= badge.threshold) earnedAt = log.performed_at;
  }
  return { ...badge, earned: Boolean(earnedAt), earnedAt, progress: Math.min(cumulative, badge.threshold) };
}

function amountInMetres(log: ActivityLog) {
  const amount = Number(log.amount || 0);
  const unit = String(log.unit || '').toLowerCase();
  if (unit === 'km') return amount * 1000;
  if (unit === 'm' || unit === 'metre' || unit === 'metres') return amount;
  return 0;
}

function formatKm(metres: number) {
  const km = metres / 1000;
  return Number.isInteger(km) ? `${km}K` : `${km.toFixed(1)}K`;
}
