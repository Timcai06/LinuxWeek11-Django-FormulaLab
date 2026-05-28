import gsap from "gsap";
import katex from "katex";
import { SplitText } from "gsap/SplitText";
import { formulaChapters } from "../../data/formula-chapters";
import type { FormulaChapter } from "../../data/formula-chapters";
import type { ChapterState } from "./chapter-director";

gsap.registerPlugin(SplitText);

type StoryElements = {
  label: HTMLElement | null;
  formula: HTMLElement | null;
  author: HTMLElement | null;
  story: HTMLElement | null;
  origin: HTMLElement | null;
  conflict: HTMLElement | null;
  legacy: HTMLElement | null;
  product: HTMLElement | null;
};

let activeChapterId = "";
let activeSplits: SplitText[] = [];

function queryStoryElements(root: HTMLElement): StoryElements {
  return {
    label: root.querySelector<HTMLElement>("[data-chapter-label]"),
    formula: root.querySelector<HTMLElement>("[data-chapter-formula]"),
    author: root.querySelector<HTMLElement>("[data-chapter-author]"),
    story: root.querySelector<HTMLElement>("[data-chapter-story]"),
    origin: root.querySelector<HTMLElement>("[data-chapter-origin]"),
    conflict: root.querySelector<HTMLElement>("[data-chapter-conflict]"),
    legacy: root.querySelector<HTMLElement>("[data-chapter-legacy]"),
    product: root.querySelector<HTMLElement>("[data-chapter-product]"),
  };
}

function writeChapter(elements: StoryElements, chapter: FormulaChapter) {
  if (elements.label) {
    elements.label.textContent = chapter.label;
  }
  if (elements.formula) {
    katex.render(chapter.formula, elements.formula, {
      displayMode: true,
      output: "html",
      throwOnError: false,
      trust: false,
    });
  }
  if (elements.author) {
    elements.author.textContent = `${chapter.author} / ${chapter.era}`;
  }
  if (elements.origin) {
    elements.origin.textContent = chapter.origin;
  }
  if (elements.conflict) {
    elements.conflict.textContent = chapter.conflict;
  }
  if (elements.legacy) {
    elements.legacy.textContent = chapter.legacy;
  }
  if (elements.product) {
    elements.product.textContent = chapter.productLink;
  }
}

function animateChapterIn(elements: StoryElements) {
  activeSplits.forEach((split) => split.revert());
  activeSplits = [];

  const textBlocks = [elements.author, elements.origin, elements.conflict, elements.legacy, elements.product].filter(
    Boolean,
  ) as HTMLElement[];

  activeSplits = textBlocks.map((element) => SplitText.create(element, { type: "lines", mask: "lines" }));
  const lines = activeSplits.flatMap((split) => split.lines);

  if (elements.formula) {
    gsap.fromTo(
      elements.formula,
      { y: 22, z: 0, opacity: 0, rotateX: -12, scale: 0.96 },
      { y: 0, opacity: 1, rotateX: 0, scale: 1, duration: 0.86, ease: "expo.out", overwrite: true },
    );
  }

  gsap.set(lines, { yPercent: 112, opacity: 0 });
  gsap.to(lines, {
    yPercent: 0,
    opacity: 1,
    duration: 0.84,
    ease: "expo.out",
    stagger: 0.045,
    overwrite: true,
  });
}

export function renderChapterStory(root: HTMLElement, state: ChapterState) {
  const chapter = formulaChapters[state.activeIndex];
  root.style.setProperty("--chapter-progress", state.localProgress.toFixed(4));
  const chapterWindow = state.globalProgress > 0.38 && state.globalProgress < 0.76 ? 1 : 0;
  root.style.setProperty("--chapter-story-opacity", String(chapterWindow));
  root.dataset.activeChapter = chapter.id;

  const elements = queryStoryElements(root);
  if (activeChapterId !== chapter.id) {
    activeChapterId = chapter.id;
    writeChapter(elements, chapter);
    animateChapterIn(elements);
  }
}
