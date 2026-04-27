import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* This hides the top header bar from the mobile app */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}