import { StyleSheet, Text, View } from 'react-native';

import { colours } from '@/theme/colours';

type Props = {
  minutes: number;
  target?: number;
};

const TICKS = 24;
const SIZE = 190;
const RADIUS = 78;

function tickColour(index: number, percentage: number) {
  if (percentage >= 300) return colours.gold;

  const progressTicks = Math.min(TICKS, Math.round((Math.min(percentage, 100) / 100) * TICKS));
  if (index >= progressTicks) return colours.ringTrack;

  if (percentage >= 200) return colours.green3;
  if (percentage >= 100) return colours.green2;
  return colours.green1;
}

export function ProgressRing({ minutes, target = 30 }: Props) {
  const percentage = target > 0 ? Math.round((minutes / target) * 100) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.ring}>
        {Array.from({ length: TICKS }).map((_, index) => {
          const angle = (index / TICKS) * Math.PI * 2 - Math.PI / 2;
          const x = SIZE / 2 + Math.cos(angle) * RADIUS - 3;
          const y = SIZE / 2 + Math.sin(angle) * RADIUS - 10;

          return (
            <View
              key={index}
              style={[
                styles.tick,
                {
                  left: x,
                  top: y,
                  backgroundColor: tickColour(index, percentage),
                  transform: [{ rotate: `${index * (360 / TICKS)}deg` }],
                },
              ]}
            />
          );
        })}
        <View style={styles.center}>
          <Text style={styles.percentage}>{percentage}%</Text>
          <Text style={styles.minutes}>{Math.round(minutes)} / {target} MIN</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  ring: { width: SIZE, height: SIZE, position: 'relative' },
  tick: { position: 'absolute', width: 6, height: 20, borderRadius: 4 },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  percentage: { color: colours.white, fontSize: 34, fontWeight: '900' },
  minutes: { color: colours.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginTop: 4 },
});
