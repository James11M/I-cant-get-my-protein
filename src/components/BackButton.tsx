import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { router } from 'expo-router';

import { colours } from '@/theme/colours';

type Props = {
  label?: string;
  style?: ViewStyle;
};

export function BackButton({ label = 'BACK', style }: Props) {
  return (
    <Pressable style={[styles.button, style]} onPress={() => router.back()}>
      <Text style={styles.text}>← {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    minHeight: 38,
    minWidth: 104,
    borderWidth: 1,
    borderColor: colours.gold,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 12,
    backgroundColor: colours.card,
  },
  text: {
    color: colours.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
});
