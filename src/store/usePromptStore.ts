import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Prompt = {
  id: string;
  title: string;
  description: string;
  options: { id: string; label: string }[];
};

export type Response = {
  promptId: string;
  optionId: string;
  submittedAt: string;
};

type PromptState = {
  prompts: Prompt[];
  responses: Response[];
  currentIndex: number;
  lastCompletedOn?: string;
  completedToday: boolean;
};

type PromptActions = {
  setPrompts: (prompts: Prompt[]) => void;
  next: () => void;
  back: () => void;
  recordResponse: (promptId: string, optionId: string) => void;
  resetForToday: () => void;
};

const isSameDay = (first?: string, second?: string) => {
  if (!first || !second) return false;
  const a = new Date(first);
  const b = new Date(second);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export const usePromptStore = create<PromptState & PromptActions>()(
  persist(
    (set, get) => ({
      prompts: [],
      responses: [],
      currentIndex: 0,
      lastCompletedOn: undefined,
      completedToday: false,
      setPrompts: (prompts) => {
        const today = new Date();
        const { lastCompletedOn } = get();
        const completedToday = isSameDay(lastCompletedOn, today.toISOString());
        set({ prompts, responses: completedToday ? get().responses : [], completedToday });
      },
      next: () => {
        const { currentIndex, prompts } = get();
        if (currentIndex < prompts.length - 1) {
          set({ currentIndex: currentIndex + 1 });
        }
      },
      back: () => {
        const { currentIndex } = get();
        if (currentIndex > 0) {
          set({ currentIndex: currentIndex - 1 });
        }
      },
      recordResponse: (promptId, optionId) => {
        const now = new Date();
        const response: Response = {
          promptId,
          optionId,
          submittedAt: now.toISOString(),
        };

        set((state) => {
          const responses = [...state.responses.filter((r) => r.promptId !== promptId), response];
          const completedToday = responses.length >= state.prompts.length;
          return {
            responses,
            completedToday,
            lastCompletedOn: completedToday ? now.toISOString() : state.lastCompletedOn,
          };
        });
      },
      resetForToday: () => {
        const today = new Date();
        const todayIso = today.toISOString();
        const { lastCompletedOn } = get();
        if (!isSameDay(todayIso, lastCompletedOn)) {
          set({ currentIndex: 0, responses: [], completedToday: false });
        }
      },
    }),
    {
      name: "prompt-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        responses: state.responses,
        lastCompletedOn: state.lastCompletedOn,
      }),
    }
  )
);
