import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

import { WORKBENCH_GATE } from "../storyChoreography";
import { getLandingMotionRuntime } from "../performance/motionRuntime";
import { createScrollFrameGate } from "../performance/scrollFrameGate";
import { progressBetween } from "../three/motion";

gsap.registerPlugin(SplitText);

const FOOTER_VIEWBOX_WIDTH = 2278;
const FOOTER_VIEWBOX_HEIGHT = 683;
const FOOTER_WAVE_BASELINE = -0.3;
const FOOTER_WAVE_DROP = 156;
const FOOTER_PATH_CACHE_STEPS = 120;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smootherStep(value: number) {
  const t = clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function createFooterPath(waveY: number) {
  const y = waveY.toFixed(2);
  return `M0 ${FOOTER_WAVE_BASELINE}C0 ${FOOTER_WAVE_BASELINE},464 ${y},1139 ${y}S2278 ${FOOTER_WAVE_BASELINE},2278 ${FOOTER_WAVE_BASELINE}V${FOOTER_VIEWBOX_HEIGHT}H0V${FOOTER_WAVE_BASELINE}z`;
}

function createFooterPathCache() {
  return Array.from({ length: FOOTER_PATH_CACHE_STEPS + 1 }, (_, index) => {
    const t = index / FOOTER_PATH_CACHE_STEPS;
    const eased = smootherStep(t);
    const waveY = FOOTER_WAVE_DROP * (1 - eased);
    return createFooterPath(waveY);
  });
}

const footerPathCache = createFooterPathCache();

function footerPathForProgress(progress: number, velocity: number) {
  const elasticFrameLag = Math.round(clamp(Math.abs(velocity) * 120, 0, 8) * (1 - progress));
  const frameIndex = Math.min(
    FOOTER_PATH_CACHE_STEPS,
    Math.max(0, Math.round(progress * FOOTER_PATH_CACHE_STEPS) - elasticFrameLag),
  );
  return footerPathCache[frameIndex]!;
}

export function WorkbenchGateOverlay() {
  const gateRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const kickerRef = useRef<HTMLSpanElement>(null);
  const copyRef = useRef<HTMLParagraphElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const gateElement = gateRef.current;
    const pathElement = pathRef.current;
    if (!gateElement || !pathElement) {
      return undefined;
    }

    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    pathElement.setAttribute("d", isReduced ? footerPathCache[FOOTER_PATH_CACHE_STEPS]! : footerPathCache[0]!);

    let splitKicker: SplitText | undefined;
    let splitCopy: SplitText | undefined;
    let splitTicker: SplitText | undefined;
    let introTimeline: gsap.core.Timeline | undefined;
    let tickerTimeline: gsap.core.Timeline | undefined;
    let tickerReveal: gsap.core.Tween | undefined;
    let hasPlayedIntro = false;
    let previousProgress = 0;
    const frameGate = createScrollFrameGate();

    const context = gsap.context(() => {
      if (!isReduced && kickerRef.current && copyRef.current && tickerRef.current) {
        splitKicker = SplitText.create(kickerRef.current, { type: "words, chars", charsClass: "gate-kicker-char" });
        splitCopy = SplitText.create(copyRef.current, { type: "words, chars", charsClass: "gate-copy-char" });
        splitTicker = SplitText.create(tickerRef.current, { type: "words, chars", charsClass: "gate-ticker-char" });

        introTimeline = gsap
          .timeline({ paused: true, defaults: { ease: "power3.out" } })
          .from(splitKicker.chars ?? [], {
            autoAlpha: 0,
            duration: 0.52,
            stagger: { each: 0.018, from: "start" },
            yPercent: 80,
          }, 0)
          .from(splitCopy.words ?? [], {
            autoAlpha: 0,
            duration: 0.72,
            stagger: { each: 0.08, from: "start" },
            yPercent: 118,
          }, 0.18)
          .from(ctaRef.current, {
            autoAlpha: 0,
            duration: 0.56,
            scale: 0.96,
            y: 14,
          }, 0.68);

        tickerTimeline = gsap
          .timeline({ paused: true, repeat: -1 })
          .to(".gate-corner-ticker-track", {
            duration: 14,
            ease: "none",
            xPercent: -50,
          });

        tickerReveal = gsap.from(splitTicker.chars ?? [], {
          autoAlpha: 0,
          duration: 1.35,
          ease: "back.out(1.2)",
          paused: true,
          rotation: "random(-18, 18)",
          stagger: { each: 0.012, from: "random" },
          yPercent: "random(-180, 180)",
        });
      }
    }, gateElement);

    const update = (progress = 0) => {
      const velocity = progress - previousProgress;
      previousProgress = progress;

      const footerProgress = progressBetween(progress, WORKBENCH_GATE[0] - 0.006, 1);
      const gateProgress = progressBetween(progress, WORKBENCH_GATE[0], WORKBENCH_GATE[1]);
      const footerY = (1 - smootherStep(footerProgress)) * 100;
      const contentY = (1 - smootherStep(gateProgress)) * 30;
      const tickerProgress = progressBetween(progress, WORKBENCH_GATE[0], WORKBENCH_GATE[1]);

      pathElement.setAttribute("d", footerPathForProgress(footerProgress, velocity));
      gateElement.style.setProperty("--gate-footer-y", `${footerY.toFixed(3)}%`);
      gateElement.style.setProperty("--gate-content-y", `${contentY.toFixed(3)}px`);
      gateElement.style.setProperty("--gate-liquid-opacity", footerProgress.toFixed(4));
      gateElement.style.setProperty("--gate-content-opacity", gateProgress.toFixed(4));
      gateElement.style.setProperty("--gate-corner-opacity", tickerProgress.toFixed(4));

      if (gateProgress > 0.18 && !hasPlayedIntro) {
        hasPlayedIntro = true;
        introTimeline?.restart();
        tickerReveal?.restart();
        tickerTimeline?.play();
      }
      if (gateProgress <= 0.02 && hasPlayedIntro) {
        hasPlayedIntro = false;
        introTimeline?.pause(0);
        tickerReveal?.pause(0);
        tickerTimeline?.pause(0);
      }
    };

    update();
    const runtime = getLandingMotionRuntime();
    const unsubscribe = runtime.subscribe((frame) => {
      if (frameGate.shouldUpdate(frame)) {
        update(frame.progress);
      }
    });

    return () => {
      unsubscribe();
      tickerTimeline?.kill();
      tickerReveal?.kill();
      introTimeline?.kill();
      splitKicker?.revert();
      splitCopy?.revert();
      splitTicker?.revert();
      context.revert();
    };
  }, []);

  return (
    <section className="workbench-gate" aria-label="Formula Lab Workbench entry" ref={gateRef}>
      <svg
        className="gate-liquid-svg"
        preserveAspectRatio="none"
        viewBox={`0 0 ${FOOTER_VIEWBOX_WIDTH} ${FOOTER_VIEWBOX_HEIGHT}`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="gate-liquid-gradient" x1="0" y1="0" x2={FOOTER_VIEWBOX_WIDTH} y2={FOOTER_VIEWBOX_HEIGHT} gradientUnits="userSpaceOnUse">
            <stop offset="0.08" stopColor="#020403" />
            <stop offset="0.48" stopColor="#10251b" />
            <stop offset="0.86" stopColor="#5cffb0" />
          </linearGradient>
        </defs>
        <path ref={pathRef} className="gate-liquid-path" fill="url(#gate-liquid-gradient)" />
      </svg>
      <div className="gate-liquid-noise" aria-hidden="true" />
      <div className="workbench-gate-shell">
        <span className="workbench-gate-kicker" ref={kickerRef}>Formula Lab Workbench</span>
        <p className="workbench-gate-copy" ref={copyRef}>Enter a paper workspace built for formulas, review, and collaboration.</p>
        <a className="button primary workbench-gate-cta" href="/workbench/" ref={ctaRef}>
          Enter Workbench
        </a>
      </div>
      <aside className="gate-corner-ticker" aria-hidden="true">
        <div className="gate-corner-ticker-track" ref={tickerRef}>
          <span>paper workspace online</span>
          <span>formula review ready</span>
          <span>collaboration layer synced</span>
          <span>latex context preserved</span>
          <span>paper workspace online</span>
          <span>formula review ready</span>
          <span>collaboration layer synced</span>
          <span>latex context preserved</span>
        </div>
      </aside>
    </section>
  );
}
