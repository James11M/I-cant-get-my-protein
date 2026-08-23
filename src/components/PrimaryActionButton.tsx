import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colours } from '@/theme/colours';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryActionButton({ label, onPress, disabled = false, style }: Props) {
  return (
    <Pressable style={[styles.button, disabled && styles.disabled, style]} onPress={onPress} disabled={disabled}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: colours.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  disabled: { opacity: 0.5 },
  text: {
    color: colours.background,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
