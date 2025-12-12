import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type ReminderTime = { hour: number; minute: number };

const STORAGE_KEY = "daily-exercise-notification-id";
const TIME_STORAGE_KEY = "daily-exercise-notification-time";
const DEFAULT_TIME: ReminderTime = { hour: 8, minute: 0 };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const ensureAndroidChannel = async () => {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("daily-reminders", {
    name: "Daily reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
};

const ensurePermission = async () => {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
};

export const getSavedReminderTime = async (): Promise<ReminderTime> => {
  const stored = await AsyncStorage.getItem(TIME_STORAGE_KEY);
  if (!stored) return DEFAULT_TIME;

  try {
    const parsed = JSON.parse(stored) as ReminderTime;
    if (
      typeof parsed.hour === "number" &&
      typeof parsed.minute === "number" &&
      parsed.hour >= 0 &&
      parsed.hour <= 23 &&
      parsed.minute >= 0 &&
      parsed.minute <= 59
    ) {
      return parsed;
    }
  } catch (error) {
    // Ignore parsing errors and fall back to default time.
  }

  return DEFAULT_TIME;
};

export const formatReminderTime = (time: ReminderTime) => {
  const now = new Date();
  now.setHours(time.hour, time.minute, 0, 0);
  return now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export const scheduleDailyExerciseReminder = async (timeOverride?: ReminderTime) => {
  const hasPermission = await ensurePermission();
  if (!hasPermission) return;

  await ensureAndroidChannel();

  const reminderTime = timeOverride ?? (await getSavedReminderTime());
  const storedId = await AsyncStorage.getItem(STORAGE_KEY);
  if (storedId) await Notifications.cancelScheduledNotificationAsync(storedId);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Did you move your body today?",
      body: `It's ${formatReminderTime(reminderTime)} — take a second to log your exercise and celebrate it.`,
      sound: Platform.OS === "ios" ? "default" : undefined,
    },
    trigger: {
      hour: reminderTime.hour,
      minute: reminderTime.minute,
      repeats: true,
    },
  });

  await AsyncStorage.multiSet([
    [STORAGE_KEY, identifier],
    [TIME_STORAGE_KEY, JSON.stringify(reminderTime)],
  ]);
  return identifier;
};

export const updateDailyExerciseReminderTime = async (time: ReminderTime) => {
  await AsyncStorage.setItem(TIME_STORAGE_KEY, JSON.stringify(time));
  return scheduleDailyExerciseReminder(time);
};

