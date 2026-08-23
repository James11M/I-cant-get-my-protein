import { StyleSheet, Text, TextStyle } from 'react-native';

type CardActionProps = {
  colour: string;
  label?: string;
  style?: TextStyle;
};

export function CardAction({ colour, label = 'VIEW →', style }: CardActionProps) {
  return <Text style={[styles.action, { color: colour }, style]}>{label}</Text>;
}

const styles = StyleSheet.create({
  action: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
    textAlign: 'right',
  },
});
