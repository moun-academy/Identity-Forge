import { useEffect } from "react";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native";
import { scheduleDailyExerciseReminder } from "../src/services/notificationScheduler";

export default function RootLayout() {
  useEffect(() => {
    void scheduleDailyExerciseReminder();
  }, []);

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
