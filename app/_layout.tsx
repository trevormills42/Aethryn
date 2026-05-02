import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GameProvider } from "./lib/gameStore";

if (typeof globalThis.fetch === 'undefined') {
  // @ts-ignore
  globalThis.fetch = fetch;
}

export default function RootLayout() {
  return (
    <GameProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#050817' },
          animation: 'fade',
        }}
      />
    </GameProvider>
  );
}
