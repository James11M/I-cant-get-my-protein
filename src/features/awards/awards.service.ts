import { ActivityLog, getActivityLogs } from '@/features/activities/activity.service';

export type BadgeMode = 'single' | 'cumulative' | 'sessions' | 'streak' | 'comebacks';
export type BadgeGroup = 'Swimming' | 'Running' | 'Rugby' | 'Strength' | 'Streaks' | 'Comeback';

export type BadgeDefinition = {
  id: string;
  group: BadgeGroup;
  family: string;
  icon: string;
  title: string;
  description: string;
  threshold: number;
  unit: 'm' | 'km' | 'min' | 'sessions' | 'days' | 'repairs';
  mode: BadgeMode;
  activityName?: string;
  trainingType?: string;
};

export type EvaluatedBadge = BadgeDefinition & {
  earned: boolean;
  earnedAt: string | null;
  progress: number;
};

const DAILY_TARGET = 30;
const COMEBACK_RATE = 0.5;

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

const streakBadges = [3, 7, 14, 30, 60, 100].map((threshold) => ({
  id: `streak-${threshold}`,
  group: 'Streaks' as const,
  family: 'CONSECUTIVE DAYS',
  icon: '🔥',
  title: `${threshold}-DAY STREAK`,
  description: `Hit your daily target for ${threshold} consecutive days.`,
  threshold,
  unit: 'days' as const,
  mode: 'streak' as const,
}));

const comebackBadges = [1, 3, 5, 10, 25, 50].map((threshold) => ({
  id: `comeback-${threshold}`,
  group: 'Comeback' as const,
  family: 'DAYS REPAIRED',
  icon: '↻',
  title: threshold === 1 ? 'FIRST COMEBACK' : `${threshold} COMEBACKS`,
  description: threshold === 1 ? 'Repair your first missed day with Comeback Minutes.' : `Repair ${threshold} missed days with Comeback Minutes.`,
  threshold,
  unit: 'repairs' as const,
  mode: 'comebacks' as const,
}));

export const BADGES: BadgeDefinition[] = [
  ...swimmingSingle,
  ...swimmingLifetime,
  ...runningSingle,
  ...runningLifetime,
  ...rugbyLifetime,
  ...strengthSessions,
  ...streakBadges,
  ...comebackBadges,
];

export const BADGE_GROUPS: Array<'All' | BadgeGroup> = ['All', 'Swimming', 'Running', 'Rugby', 'Strength', 'Streaks', 'Comeback'];

export async function getEvaluatedBadges(): Promise<EvaluatedBadge[]> {
  const logs = await getActivityLogs();
  return evaluateBadges(logs);
}

export function evaluateBadges(logs: ActivityLog[]): EvaluatedBadge[] {
  const streakProgress = calculateStreakHistory(logs);
  const comebackProgress = calculateComebackHistory(logs);
  return BADGES.map((badge) => evaluateBadge(badge, logs, streakProgress, comebackProgress));
}

function evaluateBadge(
  badge: BadgeDefinition,
  logs: ActivityLog[],
  streakProgress: { longest: number; earnedAtByLength: Record<number, string> },
  comebackProgress: { count: number; earnedAtByCount: Record<number, string> },
): EvaluatedBadge {
  if (badge.mode === 'streak') {
    return { ...badge, earned: streakProgress.longest >= badge.threshold, earnedAt: streakProgress.earnedAtByLength[badge.threshold] || null, progress: Math.min(streakProgress.longest, badge.threshold) };
  }
  if (badge.mode === 'comebacks') {
    return { ...badge, earned: comebackProgress.count >= badge.threshold, earnedAt: comebackProgress.earnedAtByCount[badge.threshold] || null, progress: Math.min(comebackProgress.count, badge.threshold) };
  }

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

function calculateStreakHistory(logs: ActivityLog[]) {
  const daily = dailyCredits(logs);
  const keys = Object.keys(daily).sort();
  const earnedAtByLength: Record<number, string> = {};
  let current = 0;
  let longest = 0;
  let previous: Date | null = null;
  for (const key of keys) {
    const date = parseDateKey(key);
    const consecutive = previous && dayDifference(previous, date) === 1;
    if (daily[key] >= DAILY_TARGET) current = consecutive ? current + 1 : 1;
    else current = 0;
    if (current > longest) longest = current;
    if (current > 0 && !earnedAtByLength[current]) earnedAtByLength[current] = date.toISOString();
    previous = date;
  }
  return { longest, earnedAtByLength };
}

function calculateComebackHistory(logs: ActivityLog[]) {
  const daily = dailyCredits(logs);
  const keys = Object.keys(daily).sort();
  const deficits: Array<{ key: string; date: Date; remaining: number }> = [];
  const earnedAtByCount: Record<number, string> = {};
  let count = 0;

  for (const key of keys) {
    const date = parseDateKey(key);
    for (let i = deficits.length - 1; i >= 0; i -= 1) if (dayDifference(deficits[i].date, date) > 6) deficits.splice(i, 1);
    const raw = daily[key] || 0;
    const normal = Math.min(DAILY_TARGET, raw);
    let available = Math.max(0, raw - DAILY_TARGET) * COMEBACK_RATE;
    for (let i = deficits.length - 1; i >= 0 && available > 0; i -= 1) {
      const deficit = deficits[i];
      if (deficit.remaining <= 0) continue;
      const before = deficit.remaining;
      const applied = Math.min(available, deficit.remaining);
      deficit.remaining -= applied;
      available -= applied;
      if (before > 0 && deficit.remaining <= 0) {
        count += 1;
        if (!earnedAtByCount[count]) earnedAtByCount[count] = date.toISOString();
      }
    }
    const missing = Math.max(0, DAILY_TARGET - normal);
    if (missing > 0) deficits.push({ key, date, remaining: missing });
  }
  return { count, earnedAtByCount };
}

function dailyCredits(logs: ActivityLog[]) {
  return logs.reduce<Record<string, number>>((result, log) => {
    const key = dateKey(new Date(log.performed_at));
    result[key] = (result[key] || 0) + Number(log.credit_minutes || log.duration_minutes || 0);
    return result;
  }, {});
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
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function parseDateKey(key: string) { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d, 12); }
function dayDifference(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000); }
