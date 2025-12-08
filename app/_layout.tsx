import { Stack } from "expo-router";
import { SafeAreaView } from "react-native";

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: "#0f172a" },
        }}
      />
    </SafeAreaView>
  );
}
