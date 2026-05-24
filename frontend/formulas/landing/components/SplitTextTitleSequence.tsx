import { useEffect } from "react";
import gsap from "gsap";

type SplitTextTarget = Element[] | NodeListOf<Element> | undefined;

type SplitTextInstance = {
  chars?: SplitTextTarget;
  words?: SplitTextTarget;
  lines?: SplitTextTarget;
  revert: () => void;
};

type SplitTextConfig = {
  charsClass: string;
  linesClass: string;
  type: string;
  wordsClass: string;
};

type SplitTextConstructor = {
  create?: (target: Element, config: SplitTextConfig) => SplitTextInstance;
  new (target: Element, config: SplitTextConfig): SplitTextInstance;
};

declare global {
  interface Window {
    SplitText?: SplitTextConstructor;
  }
}

function createSplitInstance(target: Element): SplitTextInstance | null {
  const splitText = window.SplitText;
  if (!splitText) {
    return null;
  }

  const config = {
    charsClass: "split-title-char",
    linesClass: "split-title-line",
    type: "lines,words,chars",
    wordsClass: "split-title-word",
  } satisfies SplitTextConfig;

  try {
    if (typeof splitText.create === "function") {
      return splitText.create(target, config);
    }
    return new splitText(target, config);
  } catch {
    return null;
  }
}

function splitSegments(split: SplitTextInstance): Element[] {
  const chars = Array.from(split.chars ?? []);
  if (chars.length > 0) {
    return chars;
  }

  const words = Array.from(split.words ?? []);
  if (words.length > 0) {
    return words;
  }

  return Array.from(split.lines ?? []);
}

export function SplitTextTitleSequence() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>(".landing-hero [data-split-title]"));
    if (!targets.length) {
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const splitInstances: SplitTextInstance[] = [];
    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { duration: 0.78, ease: "power3.out" },
      });

      targets.forEach((target, index) => {
        const split = createSplitInstance(target);
        if (split) {
          splitInstances.push(split);
        }

        const segments = split ? splitSegments(split) : [target];
        const fromVars = split ? { autoAlpha: 0, rotationX: 8, y: 28 } : { autoAlpha: 0 };
        const toVars = split
          ? { autoAlpha: 1, rotationX: 0, stagger: 0.02, y: 0 }
          : { autoAlpha: 1, stagger: 0 };
        timeline.fromTo(
          segments,
          fromVars,
          toVars,
          index === 0 ? 0.12 : "-=0.48",
        );
      });
    });

    return () => {
      context.revert();
      splitInstances.forEach((split) => split.revert());
    };
  }, []);

  return null;
}
