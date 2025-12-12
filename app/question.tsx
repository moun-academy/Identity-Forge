import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  TextInput,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { getFallbackPerspective, getPerspective } from "../src/services/perspectiveLookup";
import { Prompt, usePromptStore } from "../src/store/usePromptStore";
import {
  ReminderTime,
  formatReminderTime,
  getSavedReminderTime,
  updateDailyExerciseReminderTime,
} from "../src/services/notificationScheduler";

const DAILY_PROMPTS: Prompt[] = [
  {
    id: "gratitude",
    title: "What lifted you today?",
    description: "Capture one small thing that helped you feel grounded or appreciative.",
    options: [
      { id: "nature", label: "Fresh air or nature" },
      { id: "people", label: "Someone I spoke with" },
      { id: "self", label: "A personal win" },
    ],
  },
  {
    id: "energy",
    title: "Where is your energy?",
    description: "Name the pace you're carrying into the rest of the day.",
    options: [
      { id: "high", label: "Buzzing" },
      { id: "steady", label: "Even" },
      { id: "low", label: "Gentle" },
    ],
  },
  {
    id: "connection",
    title: "Who feels close right now?",
    description: "Notice the relationships you want to strengthen today.",
    options: [
      { id: "friend", label: "A friend" },
      { id: "family", label: "Family" },
      { id: "community", label: "Community" },
    ],
  },
  {
    id: "focus",
    title: "What deserves your focus?",
    description: "Pick the area you'll give your best attention.",
    options: [
      { id: "create", label: "Creating" },
      { id: "learn", label: "Learning" },
      { id: "rest", label: "Resting" },
    ],
  },
  {
    id: "emotion",
    title: "What feeling is loudest?",
    description: "Meet it with curiosity and name it out loud.",
    options: [
      { id: "joy", label: "Joy" },
      { id: "calm", label: "Calm" },
      { id: "tension", label: "Tension" },
    ],
  },
];

type Reveal = {
  perspective: string | undefined;
  optionId: string | undefined;
};

const useCardAnimation = () => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(10)).current;

  const run = () => {
    opacity.setValue(0);
    translate.setValue(12);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
    Animated.timing(translate, {
      toValue: 0,
      duration: 260,
      delay: 40,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  };

  return { opacity, translate, run };
};

export default function QuestionScreen() {
  const { currentIndex, setPrompts, prompts, responses, next, back, completedToday } =
    usePromptStore();
  const [reveal, setReveal] = useState<Reveal>({ perspective: undefined, optionId: undefined });
  const { opacity, translate, run } = useCardAnimation();
  const [reminderTime, setReminderTime] = useState<ReminderTime>({ hour: 8, minute: 0 });
  const [timeInput, setTimeInput] = useState("08:00");
  const [timeStatus, setTimeStatus] = useState<string | null>(null);
  const [savingTime, setSavingTime] = useState(false);

  useEffect(() => {
    setPrompts(DAILY_PROMPTS);
  }, [setPrompts]);

  useEffect(() => {
    const loadReminderTime = async () => {
      const saved = await getSavedReminderTime();
      setReminderTime(saved);
      setTimeInput(`${String(saved.hour).padStart(2, "0")}:${String(saved.minute).padStart(2, "0")}`);
    };

    void loadReminderTime();
  }, []);

  useFocusEffect(
    useCallback(() => {
      usePromptStore.getState().resetForToday();
    }, [])
  );

  const prompt = useMemo(() => prompts[currentIndex], [currentIndex, prompts]);
  const respondedOption = useMemo(
    () => responses.find((r) => r.promptId === prompt?.id)?.optionId,
    [prompt?.id, responses]
  );

  useEffect(() => {
    if (!prompt) return;
    const perspective = getPerspective(prompt.id, respondedOption ?? "");
    setReveal({ perspective: perspective ?? getFallbackPerspective(prompt.id), optionId: respondedOption });
    run();
  }, [prompt, respondedOption, run]);

  const handleSelect = async (optionId: string) => {
    if (!prompt || completedToday) return;
    await Haptics.selectionAsync();
    usePromptStore.getState().recordResponse(prompt.id, optionId);
  };

  const parseTimeInput = (value: string): ReminderTime | null => {
    const sanitized = value.trim();
    const match = sanitized.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

    return { hour, minute };
  };

  const handleSaveReminderTime = async () => {
    const parsed = parseTimeInput(timeInput);
    if (!parsed) {
      setTimeStatus("Enter a valid 24-hour time like 07:30 or 18:15.");
      return;
    }

    setSavingTime(true);
    try {
      await updateDailyExerciseReminderTime(parsed);
      setReminderTime(parsed);
      setTimeStatus(`Reminder scheduled for ${formatReminderTime(parsed)}.`);
    } catch (error) {
      setTimeStatus("We couldn't update the reminder. Please try again.");
    } finally {
      setSavingTime(false);
    }
  };

  if (!prompt) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Loading today's prompts…</Text>
      </View>
    );
  }

  const progress = `${currentIndex + 1}/${prompts.length}`;
  const isLast = currentIndex === prompts.length - 1;
  const revealText = reveal.perspective;

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.progress}>{progress}</Text>
        <Text style={styles.badge}>{completedToday ? "Completed" : "In progress"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.promptTitle}>{prompt.title}</Text>
        <Text style={styles.promptDescription}>{prompt.description}</Text>
        <View style={styles.options}>
          {prompt.options.map((option) => {
            const isSelected = option.id === respondedOption;
            return (
              <Pressable
                key={option.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                android_ripple={{ color: "rgba(255,255,255,0.05)" }}
                onPress={() => handleSelect(option.id)}
              >
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {revealText && (
        <Animated.View
          style={[
            styles.revealCard,
            { opacity, transform: [{ translateY: translate }] },
            completedToday && styles.revealCompleted,
          ]}
        >
          <Text style={styles.revealLabel}>Perspective</Text>
          <Text style={styles.revealCopy}>{revealText}</Text>
        </Animated.View>
      )}

      <View style={styles.settingsCard}>
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsTitle}>Exercise reminder</Text>
          <Text style={styles.settingsDescription}>
            Choose the time you'd like to get your daily nudge.
          </Text>
        </View>
        <View style={styles.timeRow}>
          <View style={styles.timeInputWrapper}>
            <Text style={styles.timeLabel}>Reminder time (24h)</Text>
            <TextInput
              value={timeInput}
              onChangeText={setTimeInput}
              placeholder="08:00"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              style={styles.timeInput}
            />
          </View>
          <Pressable
            style={[styles.saveButton, savingTime && styles.saveButtonDisabled]}
            onPress={handleSaveReminderTime}
            disabled={savingTime}
          >
            <Text style={styles.saveButtonLabel}>{savingTime ? "Saving" : "Save"}</Text>
          </Pressable>
        </View>
        <Text style={styles.timeStatus}>
          Current reminder: {formatReminderTime(reminderTime)}
          {timeStatus ? ` — ${timeStatus}` : ""}
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable style={[styles.navButton, styles.secondary]} onPress={back} disabled={currentIndex === 0}>
          <Text style={styles.navLabel}>{currentIndex === 0 ? "" : "Back"}</Text>
        </Pressable>
        <Pressable
          style={[styles.navButton, styles.primary, (!respondedOption || isLast) && styles.navButtonWide]}
          onPress={() => {
            if (isLast || !respondedOption) return;
            next();
          }}
          disabled={!respondedOption || completedToday || isLast}
        >
          <Text style={styles.navLabel}>{isLast ? "Done" : "Next"}</Text>
        </Pressable>
      </View>
      {completedToday && (
        <Text style={styles.footerNote}>
          You completed today's prompts. New reflections will unlock tomorrow.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
    backgroundColor: "#0f172a",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  progress: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "600",
  },
  badge: {
    color: "#cbd5e1",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(148,163,184,0.12)",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  title: {
    color: "#e2e8f0",
    fontSize: 20,
    fontWeight: "700",
  },
  promptTitle: {
    color: "#e2e8f0",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  promptDescription: {
    color: "#94a3b8",
    fontSize: 15,
    marginBottom: 16,
  },
  options: {
    gap: 10,
  },
  option: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  optionSelected: {
    backgroundColor: "rgba(79,70,229,0.08)",
    borderColor: "rgba(79,70,229,0.6)",
  },
  optionLabel: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "600",
  },
  optionLabelSelected: {
    color: "#c7d2fe",
  },
  revealCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 16,
    backgroundColor: "rgba(79,70,229,0.08)",
    borderWidth: 1,
    borderColor: "rgba(79,70,229,0.4)",
  },
  revealCompleted: {
    backgroundColor: "rgba(34,197,94,0.08)",
    borderColor: "rgba(34,197,94,0.4)",
  },
  revealLabel: {
    color: "#cbd5e1",
    fontSize: 14,
    marginBottom: 6,
  },
  revealCopy: {
    color: "#e2e8f0",
    fontSize: 17,
    lineHeight: 24,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
  },
  navButtonWide: {
    flex: 1.2,
  },
  primary: {
    backgroundColor: "#4f46e5",
    borderColor: "#4338ca",
  },
  secondary: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderColor: "rgba(148,163,184,0.35)",
  },
  navLabel: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "700",
  },
  footerNote: {
    marginTop: 12,
    color: "#94a3b8",
    textAlign: "center",
    fontSize: 14,
  },
  settingsCard: {
    marginTop: 22,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  settingsHeader: { gap: 4 },
  settingsTitle: {
    color: "#e2e8f0",
    fontSize: 18,
    fontWeight: "700",
  },
  settingsDescription: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  timeInputWrapper: { flex: 1 },
  timeLabel: {
    color: "#cbd5e1",
    fontSize: 13,
    marginBottom: 6,
  },
  timeInput: {
    backgroundColor: "rgba(15,23,42,0.6)",
    borderColor: "rgba(148,163,184,0.35)",
    borderWidth: 1,
    borderRadius: 10,
    color: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4338ca",
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonLabel: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 15,
  },
  timeStatus: {
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 20,
  },
});
