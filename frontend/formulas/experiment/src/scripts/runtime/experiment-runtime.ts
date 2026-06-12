import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getChapterState } from "./chapter-director";
import { renderChapterStory } from "./dom-story";
import { createPaperScene } from "./paper-scene";

gsap.registerPlugin(ScrollTrigger);

function initDomTimeline(story: HTMLElement, onProgress: (value: number) => void) {
  gsap.set(".experiment-stage--paper", { autoAlpha: 0 });
  gsap.set(".experiment-stage--workspace", { autoAlpha: 0 });
  gsap.set(".experiment-stage--gate", { autoAlpha: 0 });
  gsap.set(".experiment-panel--left", { "--panel-x": "-34px", "--panel-y": "0px" });
  gsap.set(".experiment-panel--right", { "--panel-x": "34px", "--panel-y": "0px" });

  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: story,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.92,
      onUpdate: (self) => onProgress(self.progress),
    },
  });

  timeline
    .fromTo(".experiment-title__word--formula", { xPercent: -42 }, { xPercent: 0, duration: 0.12 }, 0)
    .fromTo(".experiment-title__word--lab", { xPercent: 42 }, { xPercent: 0, duration: 0.12 }, 0)
    .to(".experiment-title", { "--title-y": "-16vh", "--title-scale": 0.62, duration: 0.16 }, 0.12)
    .to(".experiment-subcopy", { "--copy-y": "-18px", "--intro-copy-opacity": 0, duration: 0.08 }, 0.15)
    .to(".experiment-stage--paper", { autoAlpha: 1, duration: 0.08 }, 0.2)
    .to(".experiment-panel", { "--panel-opacity": 1, "--panel-x": "0px", stagger: 0.08, duration: 0.16 }, 0.24)
    .to(".experiment-stage--intro", { autoAlpha: 0, duration: 0.12 }, 0.36)
    .to(".experiment-stage--paper", { autoAlpha: 0, duration: 0.12 }, 0.5)
    .to(".experiment-stage--workspace", { autoAlpha: 1, duration: 0.12 }, 0.52)
    .to(".experiment-grid-copy", { "--workspace-opacity": 1, duration: 0.12 }, 0.56)
    .to(".experiment-statement", { "--statement-opacity": 1, "--statement-y": "0px", duration: 0.14 }, 0.64)
    .to(".experiment-stage--workspace", { autoAlpha: 0, duration: 0.12 }, 0.78)
    .to(".experiment-stage--gate", { autoAlpha: 1, duration: 0.1 }, 0.82)
    .to(".experiment-gate", { "--gate-opacity": 1, "--gate-y": "0px", "--gate-scale": 1, duration: 0.16 }, 0.84);

  return timeline;
}

export function createExperimentRuntime(root: HTMLElement, story: HTMLElement, canvas: HTMLCanvasElement) {
  const scene = createPaperScene(canvas);
  let animationFrame = 0;
  let targetProgress = 0;
  let smoothProgress = 0;
  let lastTime = performance.now();
  let isVisible = !document.hidden;
  let lastRenderedProgress = Number.NaN;
  let lastInteractionAt = performance.now();

  const IDLE_PROGRESS_EPSILON = 0.00018;
  const IDLE_SETTLE_MS = 520;

  function writeProgress(value: number) {
    targetProgress = value;
    lastInteractionAt = performance.now();
    root.style.setProperty("--experiment-progress", value.toFixed(4));
    startRenderLoop();
  }

  function render(time: number) {
    if (!isVisible) {
      return;
    }
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    smoothProgress += (targetProgress - smoothProgress) * Math.min(1, dt * 8.5);

    const chapterState = getChapterState(smoothProgress);
    renderChapterStory(root, chapterState);
    scene.render(time, smoothProgress, chapterState.activeIndex, chapterState.localProgress);

    const progressDelta = Number.isNaN(lastRenderedProgress)
      ? Infinity
      : Math.abs(smoothProgress - lastRenderedProgress);
    lastRenderedProgress = smoothProgress;

    // The experiment page is an art-heavy WebGL surface. Keep the same visual
    // easing, but stop scheduling frames once scroll, pointer, and damping have
    // settled so an open tab does not keep the GPU awake indefinitely.
    const recentlyInteractive = time - lastInteractionAt < IDLE_SETTLE_MS;
    const stillSettling = Math.abs(targetProgress - smoothProgress) > IDLE_PROGRESS_EPSILON;
    if (progressDelta > IDLE_PROGRESS_EPSILON || recentlyInteractive || stillSettling) {
      animationFrame = requestAnimationFrame(render);
      return;
    }
    animationFrame = 0;
  }

  function startRenderLoop() {
    if (animationFrame) {
      return;
    }
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(render);
  }

  function stopRenderLoop() {
    if (!animationFrame) {
      return;
    }
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }

  const timeline = initDomTimeline(story, writeProgress);

  const onPointerMove = (event: PointerEvent) => {
    lastInteractionAt = performance.now();
    scene.setPointer(
      (event.clientX / window.innerWidth - 0.5) * 2,
      -(event.clientY / window.innerHeight - 0.5) * 2,
    );
    startRenderLoop();
  };
  const onResize = () => {
    lastRenderedProgress = Number.NaN;
    lastInteractionAt = performance.now();
    scene.resize();
    ScrollTrigger.refresh();
    startRenderLoop();
  };
  const onVisibilityChange = () => {
    isVisible = !document.hidden;
    if (isVisible) {
      lastRenderedProgress = Number.NaN;
      lastInteractionAt = performance.now();
      startRenderLoop();
      ScrollTrigger.refresh();
    } else {
      stopRenderLoop();
    }
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);

  scene.resize();
  startRenderLoop();

  return {
    destroy() {
      stopRenderLoop();
      timeline.kill();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      scene.dispose();
    },
  };
}
