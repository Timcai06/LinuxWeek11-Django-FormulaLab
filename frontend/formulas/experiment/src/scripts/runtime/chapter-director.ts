import { formulaChapters } from "../../data/formula-chapters";

export type ChapterState = {
  activeIndex: number;
  activeId: string;
  localProgress: number;
  globalProgress: number;
};

export function getChapterState(globalProgress: number): ChapterState {
  const clamped = Math.min(1, Math.max(0, globalProgress));
  const count = formulaChapters.length;
  const scaled = clamped * count;
  const activeIndex = Math.min(count - 1, Math.floor(scaled));
  const localProgress = Math.min(1, Math.max(0, scaled - activeIndex));

  return {
    activeIndex,
    activeId: formulaChapters[activeIndex].id,
    localProgress,
    globalProgress: clamped,
  };
}
