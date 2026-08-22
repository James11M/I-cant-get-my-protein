import { StyleSheet, Text, View } from 'react-native';

import { colours } from '@/theme/colours';

export function Brand() {
  return (
    <View>
      <Text style={styles.title}>I CAN&apos;T HIT MY PROTEIN</Text>
      <Text style={styles.subtitle}>SCHOOL - SPORTS - AWARDS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colours.gold,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: colours.white,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2.4,
    marginTop: 2,
  },
});
