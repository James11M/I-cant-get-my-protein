import { Stack } from 'expo-router';

import { AuthProvider } from '@/providers/AuthProvider';
import { colours } from '@/theme/colours';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colours.background },
        }}
      />
    </AuthProvider>
  );
}
