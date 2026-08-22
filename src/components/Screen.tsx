import { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, ViewStyle } from 'react-native';

import { colours } from '@/theme/colours';

type Props = PropsWithChildren<{ contentStyle?: ViewStyle }>;

export function Screen({ children, contentStyle }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colours.background },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 18, paddingBottom: 48 },
});
