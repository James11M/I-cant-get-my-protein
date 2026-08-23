import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { VisualExercise } from '@/features/exercises/repdb';
import { colours } from '@/theme/colours';

export function ExerciseVisual({ exercise, compact = false }: { exercise: VisualExercise; compact?: boolean }) {
  const [width, setWidth] = useState(compact ? 88 : 320);
  const [activeIndex, setActiveIndex] = useState(0);
  const images = exercise.imageStart && exercise.imagePeak
    ? [exercise.imageStart, exercise.imagePeak]
    : exercise.imageMain
      ? [exercise.imageMain]
      : [exercise.imageStart, exercise.imagePeak].filter(Boolean) as string[];

  if (images.length === 0) {
    return <View style={styles.fallback}><Text style={compact ? styles.fallbackSmall : styles.fallbackLarge}>{exercise.icon}</Text></View>;
  }

  if (images.length === 1) {
    return <Image source={{ uri: images[0] }} resizeMode="contain" style={styles.image} />;
  }

  return (
    <View style={styles.fill} onLayout={(event) => {
      const measured = event.nativeEvent.layout.width;
      if (measured > 0) setWidth(measured);
    }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
      >
        {images.map((uri, index) => (
          <View key={`${uri}-${index}`} style={{ width, height: compact ? 82 : 285 }}>
            <Image source={{ uri }} resizeMode="contain" style={styles.image} />
          </View>
        ))}
      </ScrollView>
      <View style={compact ? styles.dotsCompact : styles.dots}>
        {images.map((_, index) => <View key={index} style={[compact ? styles.dotSmall : styles.dot, index === activeIndex ? styles.dotOn : styles.dotOff]} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
  image: { width: '100%', height: '100%' },
  fallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: colours.card2 },
  fallbackSmall: { fontSize: 30 },
  fallbackLarge: { fontSize: 72 },
  dots: { position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dotsCompact: { position: 'absolute', bottom: 2, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  dotSmall: { width: 6, height: 6, borderRadius: 3, borderWidth: 1 },
  dotOn: { backgroundColor: colours.gold, borderColor: colours.gold },
  dotOff: { backgroundColor: 'transparent', borderColor: colours.gold, opacity: 0.65 },
});
