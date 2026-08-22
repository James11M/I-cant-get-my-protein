import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { colours } from '@/theme/colours';

type Props = { active?: 'today' | 'history' | 'leaders' | 'nerd' };

export function BottomNav({ active = 'today' }: Props) {
  return (
    <View style={styles.nav}>
      <NavItem label="TODAY" active={active === 'today'} icon={<HomeIcon active={active === 'today'} />} onPress={() => router.replace('/(app)')} />
      <NavItem label="HISTORY" active={active === 'history'} icon={<ClockIcon active={active === 'history'} />} onPress={() => router.push('/(app)/history')} />
      <Pressable style={styles.add} onPress={() => router.push('/(app)/add')}>
        <View style={styles.addCircle}><Text style={styles.addPlus}>+</Text></View>
        <Text style={styles.addLabel}>ADD</Text>
      </Pressable>
      <NavItem label="LEADERS" active={active === 'leaders'} icon={<PodiumIcon active={active === 'leaders'} />} onPress={() => router.push('/(app)/leaders')} />
      <NavItem label="NERD" active={active === 'nerd'} icon={<GearIcon active={active === 'nerd'} />} onPress={() => router.push('/(app)/nerd')} />
    </View>
  );
}

function NavItem({ label, active, icon, onPress }: { label: string; active: boolean; icon: React.ReactNode; onPress: () => void }) {
  return <Pressable style={styles.item} onPress={onPress}><View style={styles.iconArea}>{icon}</View><Text style={[styles.label, active && styles.active]}>{label}</Text></Pressable>;
}

function HomeIcon({ active }: { active: boolean }) {
  const colour = active ? colours.gold : colours.white;
  return <View style={styles.homeBox}><View style={[styles.homeRoof, { borderBottomColor: colour }]} /><View style={[styles.homeBody, { backgroundColor: colour }]}><View style={styles.homeDoor} /></View></View>;
}
function ClockIcon({ active }: { active: boolean }) {
  return <View style={[styles.clockFace, { backgroundColor: active ? colours.gold : colours.white }]}><View style={styles.clockHandLong} /><View style={styles.clockHandShort} /><View style={styles.clockCentre} /></View>;
}
function PodiumIcon({ active }: { active: boolean }) {
  const colour = active ? colours.gold : colours.white;
  return <View style={styles.podium}><View style={[styles.podiumSide, { backgroundColor: colour }]} /><View style={[styles.podiumMiddle, { backgroundColor: colour }]} /><View style={[styles.podiumSide, { backgroundColor: colour }]} /></View>;
}
function GearIcon({ active }: { active: boolean }) {
  const colour = active ? colours.gold : colours.white;
  return <View style={styles.gearBox}>{Array.from({ length: 8 }, (_, index) => <View key={index} style={[styles.gearToothWrapper, { transform: [{ rotate: `${index * 45}deg` }] }]}><View style={[styles.gearTooth, { backgroundColor: colour }]} /></View>)}<View style={[styles.gearDisc, { backgroundColor: colour }]}><View style={styles.gearHole} /></View></View>;
}

const styles = StyleSheet.create({
  nav: { borderTopWidth: 1, borderTopColor: colours.border, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 9, paddingBottom: 4 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', minHeight: 50 },
  iconArea: { height: 28, alignItems: 'center', justifyContent: 'center' },
  label: { color: colours.white, fontSize: 7, fontWeight: '900', marginTop: 3, letterSpacing: 0.7 },
  active: { color: colours.gold },
  add: { flex: 1, alignItems: 'center', minHeight: 61, marginTop: -12 },
  addCircle: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colours.gold },
  addPlus: { color: colours.background, fontSize: 29, fontWeight: '500', lineHeight: 31 },
  addLabel: { color: colours.gold, fontSize: 7, fontWeight: '900', marginTop: 3, letterSpacing: 0.9 },
  homeBox: { width: 25, height: 25, alignItems: 'center', justifyContent: 'flex-end' },
  homeRoof: { width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderBottomWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  homeBody: { width: 19, height: 13, alignItems: 'center', justifyContent: 'flex-end' },
  homeDoor: { width: 5, height: 8, backgroundColor: colours.background },
  clockFace: { width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  clockHandLong: { position: 'absolute', width: 2, height: 7, backgroundColor: colours.background, top: 5.5 },
  clockHandShort: { position: 'absolute', width: 6, height: 2, backgroundColor: colours.background, left: 11, top: 11 },
  clockCentre: { width: 3, height: 3, borderRadius: 2, backgroundColor: colours.background },
  podium: { width: 26, height: 23, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 2 },
  podiumSide: { width: 7, height: 12, borderRadius: 1 }, podiumMiddle: { width: 8, height: 20, borderRadius: 1 },
  gearBox: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center' },
  gearToothWrapper: { position: 'absolute', width: 25, height: 25, alignItems: 'center' },
  gearTooth: { width: 5, height: 7, borderRadius: 1 }, gearDisc: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  gearHole: { width: 7, height: 7, borderRadius: 4, backgroundColor: colours.background },
});
