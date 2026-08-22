import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { BottomNav } from '@/components/BottomNav';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { getActivityLogs } from '@/features/activities/activity.service';
import { useAuth } from '@/providers/AuthProvider';
import { colours } from '@/theme/colours';

export default function HomeScreen() {
  const { signOut } = useAuth();
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [todayActivities, setTodayActivities] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadToday() {
        try {
          const logs = await getActivityLogs();
          const now = new Date();
          const todaysLogs = logs.filter((log) => {
            const performed = new Date(log.performed_at);
            return performed.getFullYear() === now.getFullYear()
              && performed.getMonth() === now.getMonth()
              && performed.getDate() === now.getDate();
          });

          if (active) {
            setTodayMinutes(todaysLogs.reduce((sum, log) => sum + Number(log.credit_minutes || 0), 0));
            setTodayActivities(todaysLogs.length);
          }
        } catch {
          if (active) {
            setTodayMinutes(0);
            setTodayActivities(0);
          }
        }
      }

      loadToday();
      return () => { active = false; };
    }, []),
  );

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <View style={styles.header}>
        <Brand />
        <Pressable onPress={signOut} hitSlop={12}>
          <Text style={styles.logout}>LOG OUT</Text>
        </Pressable>
      </View>

      <View style={styles.titleRow}>
        <View>
          <Text style={styles.eyebrow}>YOUR TRAINING</Text>
          <Text style={styles.title}>TODAY</Text>
        </View>
        <View style={styles.streakPill}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakText}>0 DAY FIRE</Text>
        </View>
      </View>

      <Card style={styles.heroCard}>
        <Text style={styles.heroLabel}>DAILY ACTIVITY</Text>
        <ProgressRing minutes={todayMinutes} target={30} />
        <Text style={styles.heroCopy}>
          {todayMinutes >= 30 ? 'Daily target hit. Nice work.' : `${Math.max(0, 30 - Math.round(todayMinutes))} minutes to hit today’s target.`}
        </Text>
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>ACTIVITIES</Text>
          <Text style={styles.statValue}>{todayActivities}</Text>
          <Text style={styles.statFoot}>TODAY</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>CREDIT</Text>
          <Text style={styles.statValue}>{Math.round(todayMinutes)}</Text>
          <Text style={styles.statFoot}>MINUTES</Text>
        </Card>
      </View>

      <Pressable style={styles.primaryAction} onPress={() => router.push('/(app)/add')}>
        <View>
          <Text style={styles.actionEyebrow}>LOG TRAINING</Text>
          <Text style={styles.actionTitle}>ADD ACTIVITY</Text>
        </View>
        <Text style={styles.actionArrow}>＋</Text>
      </Pressable>

      <View style={styles.navSpacer} />
      <BottomNav active="today" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 6 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  logout: { color: colours.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14, marginBottom: 8 },
  eyebrow: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: colours.white, fontSize: 31, fontWeight: '900', letterSpacing: 0.5 },
  streakPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colours.card2, borderWidth: 1, borderColor: colours.border, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 10, marginBottom: 3 },
  streakIcon: { fontSize: 12, marginRight: 4 },
  streakText: { color: colours.white, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  heroCard: { alignItems: 'center', paddingTop: 10, paddingBottom: 10 },
  heroLabel: { color: colours.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.8 },
  heroCopy: { color: colours.muted, fontSize: 10, fontWeight: '700', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  statCard: { flex: 1, minHeight: 74, paddingVertical: 11 },
  statLabel: { color: colours.muted, fontSize: 7, fontWeight: '900', letterSpacing: 1.2 },
  statValue: { color: colours.white, fontSize: 24, fontWeight: '900', marginTop: 2 },
  statFoot: { color: colours.gold, fontSize: 7, fontWeight: '900', letterSpacing: 1.2 },
  primaryAction: { backgroundColor: colours.gold, borderRadius: 14, marginTop: 8, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionEyebrow: { color: '#5C4510', fontSize: 7, fontWeight: '900', letterSpacing: 1.5 },
  actionTitle: { color: colours.background, fontSize: 16, fontWeight: '900', marginTop: 1 },
  actionArrow: { color: colours.background, fontSize: 27, fontWeight: '500' },
  navSpacer: { flex: 1, minHeight: 4 },
});
