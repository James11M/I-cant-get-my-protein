import type { ActivityLog } from '@/features/activities/activity.service';

export const DAILY_TARGET = 30;
export const XP_WINDOW_DAYS = 365;

export const FIRE_XP = [120, 132, 144, 156, 170, 190, 214, 240] as const;
export const FIRE_MULTIPLIER = [1, 1.1, 1.2, 1.3, 1.42, 1.58, 1.78, 2] as const;

export type RankDefinition = {
  kind: 'level' | 'master-star';
  level: number;
  star: number | null;
  title: string;
  totalXp: number;
  badge: string;
  eyebrow: string;
};

export const RANKS: RankDefinition[] = [
  { kind: 'level', level: 1, star: null, title: 'Starter', totalXp: 0, badge: '1', eyebrow: 'LEVEL 1' },
  { kind: 'level', level: 2, star: null, title: 'Rookie', totalXp: 100, badge: '2', eyebrow: 'LEVEL 2' },
  { kind: 'level', level: 3, star: null, title: 'Builder', totalXp: 300, badge: '3', eyebrow: 'LEVEL 3' },
  { kind: 'level', level: 4, star: null, title: 'Challenger', totalXp: 700, badge: '4', eyebrow: 'LEVEL 4' },
  { kind: 'level', level: 5, star: null, title: 'Athlete', totalXp: 1500, badge: '5', eyebrow: 'LEVEL 5' },
  { kind: 'level', level: 6, star: null, title: 'Competitor', totalXp: 3100, badge: '6', eyebrow: 'LEVEL 6' },
  { kind: 'level', level: 7, star: null, title: 'Performer', totalXp: 6300, badge: '7', eyebrow: 'LEVEL 7' },
  { kind: 'level', level: 8, star: null, title: 'Expert', totalXp: 30000, badge: '8', eyebrow: 'LEVEL 8' },
  { kind: 'level', level: 9, star: null, title: 'Leader', totalXp: 42000, badge: '9', eyebrow: 'LEVEL 9' },
  { kind: 'level', level: 10, star: null, title: 'Master', totalXp: 51100, badge: '10', eyebrow: 'LEVEL 10' },
  { kind: 'master-star', level: 10, star: 1, title: 'Master Star 1', totalXp: 60000, badge: '★1', eyebrow: 'MASTER STAR 1' },
  { kind: 'master-star', level: 10, star: 2, title: 'Master Star 2', totalXp: 65000, badge: '★2', eyebrow: 'MASTER STAR 2' },
  { kind: 'master-star', level: 10, star: 3, title: 'Master Star 3', totalXp: 70000, badge: '★3', eyebrow: 'MASTER STAR 3' },
  { kind: 'master-star', level: 10, star: 4, title: 'Master Star 4', totalXp: 75000, badge: '★4', eyebrow: 'MASTER STAR 4' },
  { kind: 'master-star', level: 10, star: 5, title: 'Master Star 5', totalXp: 80000, badge: '★5', eyebrow: 'MASTER STAR 5' },
];

export type RankState = RankDefinition & {
  next: RankDefinition | null;
  xpToNext: number;
  progress: number;
};

export type XpTransaction = {
  date: string;
  amount: number;
  fireScore: number;
  multiplier: number;
};

export type XpSummary = {
  activeXp: number;
  lifetimeXp: number;
  transactions: XpTransaction[];
  rank: RankState;
};

export function getRank(xp: number): RankState {
  let current = RANKS[0];
  let next: RankDefinition | null = RANKS[1];

  RANKS.forEach((rank, index) => {
    if (xp >= rank.totalXp) {
      current = rank;
      next = RANKS[index + 1] ?? null;
    }
  });

  if (!next) return { ...current, next: null, xpToNext: 0, progress: 100 };

  const range = next.totalXp - current.totalXp;
  const earned = xp - current.totalXp;
  return {
    ...current,
    next,
    xpToNext: Math.max(0, next.totalXp - xp),
    progress: Math.max(0, Math.min(100, Math.round((earned / range) * 100))),
  };
}

export function calculateXpSummary(logs: ActivityLog[], today = new Date()): XpSummary {
  const transactions: XpTransaction[] = [];

  for (const date of transactionDates(logs, today)) {
    // Match the POC: comeback may repair streak/history status, but XP is only
    // awarded on a day whose own training reaches the daily target.
    if (normalCredit(logsForDate(logs, date)) < DAILY_TARGET) continue;

    // Reconstruct the reward as it would have stood on that date, so later
    // comeback credit does not rewrite an earlier day's fire-score reward.
    const fireScore = fireScoreEndingOn(logs, date, date);
    transactions.push({ date: dateKey(date), amount: FIRE_XP[fireScore], fireScore, multiplier: FIRE_MULTIPLIER[fireScore] });
  }

  const lifetimeXp = transactions.reduce((sum, item) => sum + item.amount, 0);
  const activeXp = transactions.reduce((sum, item) => {
    const age = daysBetween(parseDateKey(item.date), today);
    return age >= 0 && age < XP_WINDOW_DAYS ? sum + item.amount : sum;
  }, 0);

  return { activeXp, lifetimeXp, transactions, rank: getRank(activeXp) };
}

export function getTodayReward(logs: ActivityLog[], today = new Date()) {
  const complete = effectiveComplete(logs, today, today);
  const priorSix = Array.from({ length: 6 }, (_, index) => addDays(today, index - 6))
    .filter((date) => effectiveComplete(logs, date, today)).length;
  const score = complete ? fireScoreEndingOn(logs, today, today) : Math.min(7, priorSix + 1);
  return { complete, fireScore: score, xp: FIRE_XP[score], multiplier: FIRE_MULTIPLIER[score] };
}

export function effectiveCredit(logs: ActivityLog[], date: Date, today = new Date()) {
  return Math.min(DAILY_TARGET, normalCredit(logsForDate(logs, date)) + recoveredForDate(logs, date, today));
}

export function effectiveComplete(logs: ActivityLog[], date: Date, today = new Date()) {
  return effectiveCredit(logs, date, today) >= DAILY_TARGET;
}

function fireScoreEndingOn(logs: ActivityLog[], date: Date, today: Date) {
  return Array.from({ length: 7 }, (_, index) => addDays(date, index - 6))
    .filter((day) => effectiveComplete(logs, day, today)).length;
}

function transactionDates(logs: ActivityLog[], today: Date) {
  if (!logs.length) return [] as Date[];
  const earliest = logs.reduce((min, log) => {
    const date = new Date(log.performed_at);
    return date < min ? date : min;
  }, new Date(logs[0].performed_at));

  const result: Date[] = [];
  let cursor = dayOnly(earliest);
  const end = dayOnly(today);
  while (cursor <= end) {
    result.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return result;
}

function recoveredForDate(logs: ActivityLog[], date: Date, today: Date) {
  return weeklyComeback(logs, date, today).recoveredByDate[dateKey(date)] ?? 0;
}

function weeklyComeback(logs: ActivityLog[], weekDate: Date, today: Date) {
  const monday = startOfWeek(weekDate);
  const sunday = addDays(monday, 6);
  const currentWeek = dateKey(startOfWeek(today)) === dateKey(monday);
  const cutoff = currentWeek ? today : sunday;
  const deficits: { key: string; remaining: number }[] = [];
  const recoveredByDate: Record<string, number> = {};

  for (let index = 0; index < 7; index += 1) {
    const date = addDays(monday, index);
    if (dateKey(date) > dateKey(cutoff)) break;

    const items = logsForDate(logs, date);
    const raw = normalCredit(items);
    const missing = Math.max(0, DAILY_TARGET - raw);
    let available = extraCredit(items) * 0.5;

    for (const deficit of deficits) {
      if (available <= 0) break;
      if (deficit.remaining <= 0) continue;
      const applied = Math.min(available, deficit.remaining);
      deficit.remaining -= applied;
      available -= applied;
      recoveredByDate[deficit.key] = (recoveredByDate[deficit.key] ?? 0) + applied;
    }

    if (missing > 0) deficits.push({ key: dateKey(date), remaining: missing });
  }

  return { recoveredByDate };
}

function logsForDate(logs: ActivityLog[], date: Date) {
  return logs.filter((log) => dateKey(new Date(log.performed_at)) === dateKey(date));
}

function rawCredit(items: ActivityLog[]) {
  return items.reduce((sum, item) => sum + Number(item.credit_minutes || 0), 0);
}

function normalCredit(items: ActivityLog[]) {
  return Math.min(DAILY_TARGET, rawCredit(items));
}

function extraCredit(items: ActivityLog[]) {
  return Math.max(0, rawCredit(items) - DAILY_TARGET);
}

function dayOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function startOfWeek(date: Date) {
  const copy = dayOnly(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() + (day === 0 ? -6 : 1 - day));
  return copy;
}

function addDays(date: Date, amount: number) {
  const copy = dayOnly(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function daysBetween(a: Date, b: Date) {
  const first = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const second = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((second.getTime() - first.getTime()) / 86400000);
}
