import perspectives from "../data/perspectives.json";

type PerspectiveEntry = {
  promptId: string;
  options: Record<string, string>;
};

const collection = perspectives as PerspectiveEntry[];

export const getPerspective = (promptId: string, optionId: string) => {
  const entry = collection.find((item) => item.promptId === promptId);
  if (!entry) return undefined;
  return entry.options[optionId];
};

export const getFallbackPerspective = (promptId: string) => {
  const entry = collection.find((item) => item.promptId === promptId);
  if (!entry) return undefined;
  const first = Object.values(entry.options)[0];
  return first;
};
