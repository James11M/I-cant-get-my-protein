import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colours } from '@/theme/colours';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'gold' | 'danger';
};

export function PrimaryActionButton({ label, onPress, disabled = false, style, variant = 'gold' }: Props) {
  const danger = variant === 'danger';
  return (
    <Pressable style={[styles.button, danger && styles.dangerButton, disabled && styles.disabled, style]} onPress={onPress} disabled={disabled}>
      <Text style={[styles.text, danger && styles.dangerText]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{label}</Text>
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
  dangerButton: { backgroundColor: colours.red },
  disabled: { opacity: 0.5 },
  text: {
    color: colours.background,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  dangerText: { color: colours.white },
});
