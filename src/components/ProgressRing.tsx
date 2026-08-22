import { StyleSheet, Text, View } from 'react-native';

import { colours } from '@/theme/colours';

type Props = {
  minutes: number;
  target?: number;
};

const TICKS = 24;
const SIZE = 120;
const RADIUS = 49;

function tickColour(index: number, percentage: number) {
  if (percentage >= 300) return colours.gold;

  if (percentage >= 200) {
    const overlay = Math.round(((percentage - 200) / 100) * TICKS);
    return index < overlay ? colours.green3 : colours.green2;
  }

  if (percentage >= 100) {
    const overlay = Math.round(((percentage - 100) / 100) * TICKS);
    return index < overlay ? colours.green2 : colours.green1;
  }

  const filled = Math.round((Math.max(0, percentage) / 100) * TICKS);
  return index < filled ? colours.green1 : colours.ringTrack;
}

export function ProgressRing({ minutes, target = 30 }: Props) {
  const percentage = target > 0 ? Math.round((minutes / target) * 100) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.ring}>
        {Array.from({ length: TICKS }).map((_, index) => {
          const angle = (index / TICKS) * Math.PI * 2 - Math.PI / 2;
          const x = SIZE / 2 + Math.cos(angle) * RADIUS - 2;
          const y = SIZE / 2 + Math.sin(angle) * RADIUS - 6.5;

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
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: { width: SIZE, height: SIZE, position: 'relative' },
  tick: { position: 'absolute', width: 4, height: 13, borderRadius: 4 },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  percentage: { color: colours.white, fontSize: 23, fontWeight: '900' },
  minutes: { color: colours.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.9, marginTop: 2 },
});
