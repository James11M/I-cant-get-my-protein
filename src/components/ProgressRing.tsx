import { StyleSheet, Text, View } from 'react-native';

import { colours } from '@/theme/colours';

type Props = {
  minutes: number;
  target?: number;
};

const SEGMENTS = 24;
const SIZE = 80;

function segmentColour(index: number, progress: number) {
  if (progress >= 3) return colours.gold;

  const position = (index + 0.5) / SEGMENTS;

  if (progress >= 2 + position) return colours.green3;
  if (progress >= 1 + position) return colours.green2;
  if (progress >= position) return colours.green1;

  if (progress >= 2) return colours.green2;
  if (progress >= 1) return colours.green1;

  return colours.ringTrack;
}

function percentageColour(progress: number) {
  if (progress >= 3) return colours.gold;
  if (progress >= 2) return colours.green3;
  if (progress >= 1) return colours.green2;
  return colours.green1;
}

export function ProgressRing({ minutes, target = 30 }: Props) {
  const progress = target > 0 ? minutes / target : 0;
  const percentage = Math.max(0, Math.round(progress * 100));

  return (
    <View style={styles.segmentRing}>
      {Array.from({ length: SEGMENTS }, (_, index) => (
        <View
          key={index}
          pointerEvents="none"
          style={[
            styles.ringSegmentWrapper,
            { transform: [{ rotate: `${index * (360 / SEGMENTS)}deg` }] },
          ]}
        >
          <View style={styles.ringSegmentTrack} />
          <View
            style={[
              styles.ringSegmentActive,
              { backgroundColor: segmentColour(index, progress) },
            ]}
          />
        </View>
      ))}

      <View style={styles.segmentRingInner}>
        <Text style={[styles.ringPercent, { color: percentageColour(progress) }]}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segmentRing: {
    width: SIZE,
    height: SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSegmentWrapper: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
  },
  ringSegmentTrack: {
    position: 'absolute',
    top: 2,
    width: 5,
    height: 11,
    borderRadius: 3,
    backgroundColor: colours.ringTrack,
  },
  ringSegmentActive: {
    position: 'absolute',
    top: 2,
    width: 5,
    height: 11,
    borderRadius: 3,
  },
  segmentRingInner: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: colours.card,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  ringPercent: {
    fontSize: 11,
    fontWeight: '900',
  },
});
