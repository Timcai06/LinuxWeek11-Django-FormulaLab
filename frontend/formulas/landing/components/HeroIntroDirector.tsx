import { useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";

type HeroIntroDirectorProps = {
  heroRef: RefObject<HTMLElement | null>;
};

const INTRO_LOCK_CLASS = "landing-intro-scroll-lock";
const INTRO_ACTIVE_CLASS = "landing-intro-active";
const INTRO_COMPLETE_CLASS = "landing-intro-complete";

export function HeroIntroDirector({ heroRef }: HeroIntroDirectorProps) {
  const curtainRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const heroElement = heroRef.current;
    const storyElement = heroElement?.closest(".landing-story");
    const curtainElement = curtainRef.current;
    if (!heroElement || !storyElement || !curtainElement) {
      return undefined;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      storyElement.classList.add(INTRO_COMPLETE_CLASS);
      return undefined;
    }

    storyElement.classList.remove(INTRO_COMPLETE_CLASS);
    storyElement.classList.add(INTRO_ACTIVE_CLASS);
    document.body.classList.add(INTRO_LOCK_CLASS);

    const frameId = window.requestAnimationFrame(() => {
      const title = heroElement.querySelector<HTMLElement>(".glitch-title");
      const titleLines = Array.from(heroElement.querySelectorAll<HTMLElement>(".title-line"));
      const titleChars = Array.from(heroElement.querySelectorAll<HTMLElement>(".split-title-char"));
      const missionActions = heroElement.querySelector<HTMLElement>(".mission-actions");
      const actionLinks = Array.from(heroElement.querySelectorAll<HTMLElement>(".mission-actions .button"));
      const readout = heroElement.querySelector<HTMLElement>(".landing-readout");
      const readoutLines = Array.from(heroElement.querySelectorAll<HTMLElement>(".readout-line"));
      const gridLayer = storyElement.querySelector<HTMLElement>(".grid-bg-layer");
      const mathCosmos = storyElement.querySelector<HTMLElement>(".math-cosmos");
      const formulaVortex = storyElement.querySelector<HTMLElement>(".formula-vortex-canvas");
      const manuscriptCanvas = storyElement.querySelector<HTMLElement>(".webgl-canvas-container");
      const introSurface = curtainElement.querySelector<HTMLElement>(".brand-intro-surface");
      const introSlabs = Array.from(curtainElement.querySelectorAll<HTMLElement>(".brand-intro-slab"));
      const introEchoes = Array.from(curtainElement.querySelectorAll<HTMLElement>(".brand-intro-echo"));
      const introBeam = curtainElement.querySelector<HTMLElement>(".brand-intro-beam");
      const introFrame = curtainElement.querySelector<HTMLElement>(".brand-intro-frame");
      const vectorSystem = curtainElement.querySelector<SVGSVGElement>(".brand-intro-vector-system");
      const vectorPaths = Array.from(curtainElement.querySelectorAll<SVGPathElement>(".brand-intro-vector-path"));
      const vectorNodes = Array.from(curtainElement.querySelectorAll<SVGCircleElement>(".brand-intro-vector-node"));
      const vectorLabels = Array.from(curtainElement.querySelectorAll<SVGTextElement>(".brand-intro-vector-label"));
      const formulaLine = heroElement.querySelector<HTMLElement>(".title-line-formula");
      const labLine = heroElement.querySelector<HTMLElement>(".title-line-lab");
      if (!title || !formulaLine || !labLine) {
        storyElement.classList.remove(INTRO_ACTIVE_CLASS);
        storyElement.classList.add(INTRO_COMPLETE_CLASS);
        document.body.classList.remove(INTRO_LOCK_CLASS);
        return;
      }

      const context = gsap.context(() => {
        gsap.registerPlugin(DrawSVGPlugin);
        const introTitleLines = [formulaLine, labLine];
        const ambientTargets = [gridLayer, mathCosmos, formulaVortex, manuscriptCanvas].filter(Boolean) as HTMLElement[];
        const cleanupTargets = [
          curtainElement,
          title,
          missionActions,
          readout,
          ...ambientTargets,
          ...titleLines,
          ...titleChars,
          ...actionLinks,
          ...readoutLines,
          vectorSystem,
          ...vectorPaths,
          ...vectorNodes,
          ...vectorLabels,
        ].filter(Boolean) as HTMLElement[];
        gsap.set(curtainElement, {
          autoAlpha: 1,
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          xPercent: 0,
        });
        // Film grain on ::after is always active during intro; it disappears
        // automatically when curtain gets autoAlpha: 0 in the lockToHero phase.
        gsap.set(gridLayer, { autoAlpha: 0, y: 8 });
        gsap.set(mathCosmos, { autoAlpha: 0, y: 16 });
        gsap.set(formulaVortex, { autoAlpha: 0 });
        gsap.set(manuscriptCanvas, { autoAlpha: 0, x: 28, y: 12, scale: 0.965, transformOrigin: "58% 50%" });
        gsap.set(introSurface, { autoAlpha: 0 });
        gsap.set(introSlabs, { autoAlpha: 0, xPercent: -112 });
        gsap.set(introEchoes, { autoAlpha: 0, xPercent: -18 });
        gsap.set(introBeam, { autoAlpha: 0, xPercent: -120 });
        gsap.set(introFrame, { autoAlpha: 0, scaleX: 0.42, transformOrigin: "50% 50%" });
        gsap.set(vectorSystem, { autoAlpha: 0 });
        gsap.set(vectorPaths, { drawSVG: "0% 0%" });
        gsap.set(vectorNodes, { autoAlpha: 0, scale: 0.72, transformOrigin: "50% 50%" });
        gsap.set(vectorLabels, { autoAlpha: 0, y: 5 });
        // Title container
        gsap.set(title, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          force3D: false,
          transformOrigin: "50% 50%",
          textShadow: "none",
        });
        gsap.set(titleLines, {
          force3D: false,
          opacity: 0,
          scale: 1,
          left: 0,
          top: 0,
          transformOrigin: "50% 50%",
          x: 0,
          y: 0,
        });
        
        const finalTitleFontSize = getComputedStyle(title).fontSize;
        const calibrationFontSize = "clamp(2.1rem, 4.2vw, 5rem)";

        // Apply dramatic initial letter-spacing first, so bounding box includes the expanded width
        gsap.set(introTitleLines, { letterSpacing: "0.16em" });
        
        const formulaRect = formulaLine.getBoundingClientRect();
        const labRect = labLine.getBoundingClientRect();
        const calibrationTop = -formulaRect.top + window.innerHeight * 0.46;
        const calibrationLabTop = -labRect.top + window.innerHeight * 0.46;
        const calibrationFormulaLeft = -formulaRect.left + window.innerWidth * 0.5 - formulaRect.width * 0.62;
        const calibrationLabLeft = -labRect.left + window.innerWidth * 0.5 + formulaRect.width * 0.08;
        
        // Exact pixel math to push to the absolute corners, accounting for current window size and exact text width
        gsap.set(formulaLine, {
          autoAlpha: 0,
          left: -formulaRect.left + 48,
          top: -formulaRect.top + 48,
        });
        gsap.set(labLine, {
          autoAlpha: 0,
          left: window.innerWidth - labRect.right - 48,
          top: window.innerHeight - labRect.bottom - 48,
        });
        // Per-char initial state for letter-level stagger
        if (titleChars.length > 0) {
          gsap.set(titleChars, {
            autoAlpha: 0,
            y: (i: number) => 12 + (i % 3) * 6,
            rotateX: (i: number) => -4 + (i % 5) * 2.4,
            scale: 0.88,
          });
        }
        gsap.set(missionActions, { autoAlpha: 0, y: 12 });
        gsap.set(actionLinks, { autoAlpha: 0, y: 8 });
        gsap.set(readout, { autoAlpha: 0, x: 18 });
        gsap.set(readoutLines, { autoAlpha: 0, x: 10 });

        gsap
          .timeline({
            defaults: { ease: "power3.out" },
            onComplete() {
              storyElement.classList.remove(INTRO_ACTIVE_CLASS);
              storyElement.classList.add(INTRO_COMPLETE_CLASS);
              document.body.classList.remove(INTRO_LOCK_CLASS);
              gsap.set(cleanupTargets, { clearProps: "all" });
            },
          })
          // ── Phase 1: BLACKOUT — Title lines appear, chars stagger in ──
          .addLabel("blackout", 0)
          .to(gridLayer, { autoAlpha: 0.22, duration: 0.92, ease: "power2.out", y: 0 }, "blackout+=0.28")
          .to(
            introTitleLines,
            {
              autoAlpha: 1,
              duration: 0.84,
              ease: "power3.out",
              stagger: 0.1,
            },
            "blackout+=0.22",
          )
          // Letter-level char stagger — each char rises into place independently
          .to(
            titleChars.length > 0 ? titleChars : [],
            {
              autoAlpha: 1,
              y: 0,
              rotateX: 0,
              scale: 1,
              duration: 0.72,
              ease: "back.out(1.2)",
              stagger: 0.018,
            },
            "blackout+=0.32",
          )
          .to(introFrame, { autoAlpha: 0.52, duration: 0.46, ease: "power2.out", scaleX: 0.72 }, "blackout+=0.72")
          .to(vectorSystem, { autoAlpha: 0.78, duration: 0.4, ease: "power2.out" }, "blackout+=0.62")
          .to(vectorPaths, { drawSVG: "0% 42%", duration: 0.78, ease: "power2.inOut", stagger: 0.055 }, "blackout+=0.68")
          .to(vectorNodes, { autoAlpha: 0.7, scale: 1, duration: 0.46, ease: "back.out(1.25)", stagger: 0.045 }, "blackout+=0.86")

          // ── Calibration hold — real title becomes a small centered brand lockup ──
          .addLabel("calibrationHold", "blackout+=1.08")
          .to(
            title,
            {
              fontSize: calibrationFontSize,
              duration: 0.7,
              ease: "power3.inOut",
            },
            "calibrationHold",
          )
          .to(
            formulaLine,
            {
              left: calibrationFormulaLeft,
              top: calibrationTop,
              letterSpacing: "0.02em",
              duration: 0.72,
              ease: "power3.inOut",
            },
            "calibrationHold",
          )
          .to(
            labLine,
            {
              left: calibrationLabLeft,
              top: calibrationLabTop,
              letterSpacing: "0.02em",
              duration: 0.72,
              ease: "power3.inOut",
            },
            "calibrationHold+=0.02",
          )
          .to(introFrame, { autoAlpha: 0.38, duration: 0.42, ease: "power2.out", scaleX: 0.52 }, "calibrationHold+=0.34")
          .to(vectorNodes, { autoAlpha: 0.42, duration: 0.38, ease: "power2.out" }, "calibrationHold+=0.42")

          // ── Phase 2: WARM CUT — Warm surface, slabs, echoes emerge ──
          .addLabel("warmCut", "calibrationHold+=0.88")
          .to(introSurface, { autoAlpha: 1, duration: 0.38, ease: "power2.out" }, "warmCut")
          .to(
            introSlabs,
            { autoAlpha: 0.72, duration: 0.82, ease: "expo.out", stagger: 0.075, xPercent: 0 },
            "warmCut+=0.02",
          )
          .to(mathCosmos, { autoAlpha: 0.18, duration: 0.74, ease: "power2.out", y: 6 }, "warmCut+=0.08")
          .to(manuscriptCanvas, { autoAlpha: 0.2, duration: 0.82, ease: "power2.out", scale: 0.98, x: 18, y: 8 }, "warmCut+=0.16")
          .to(introEchoes, { autoAlpha: 0.22, duration: 0.34, ease: "power2.out", stagger: 0.06, xPercent: 0 }, "warmCut+=0.14")
          .to(vectorPaths, { drawSVG: "0% 82%", duration: 0.84, ease: "power2.inOut", stagger: 0.035 }, "warmCut+=0.08")
          .to(vectorLabels, { autoAlpha: 0.68, y: 0, duration: 0.44, ease: "power3.out", stagger: 0.075 }, "warmCut+=0.2")

          // ── Breathing pause — a dramatic beat before convergence ──
          .addLabel("breathe", "warmCut+=0.56")

          // ── Phase 3: VECTOR SHIFT — Letters converge, letter-spacing tightens ──
          .addLabel("vectorShift", "breathe+=0.25")
          .to(
            introTitleLines,
            {
              left: 0,
              top: 0,
              // Overshoot: compress past zero for momentary tension
              letterSpacing: "-0.015em",
              duration: 1.32,
              ease: "power3.inOut",
            },
            "vectorShift",
          )
          // Green accent pulse — brief environment light leak on convergence
          .to(title, {
            textShadow: "0 0 80px rgba(92, 255, 176, 0.35), 0 0 160px rgba(92, 255, 176, 0.12)",
            duration: 0.42,
            ease: "power2.in",
          }, "vectorShift+=0.38")
          .to(title, {
            textShadow: "0 0 0px rgba(92, 255, 176, 0)",
            duration: 0.54,
            ease: "power3.out",
          }, "vectorShift+=0.82")
          .to(title, {
            fontSize: finalTitleFontSize,
            duration: 1.38,
            ease: "expo.out",
          }, "vectorShift+=0.12")
          .to(introFrame, { autoAlpha: 0.78, duration: 0.42, ease: "power2.out", scaleX: 1 }, "vectorShift+=0.14")
          .to(introBeam, { autoAlpha: 1, duration: 0.24, ease: "power2.out" }, "vectorShift+=0.18")
          .to(introBeam, { xPercent: 120, duration: 1.02, ease: "power2.inOut" }, "vectorShift+=0.2")
          .to(vectorPaths, { drawSVG: "0% 100%", duration: 1.02, ease: "power3.inOut", stagger: 0.04 }, "vectorShift+=0.04")
          .to(vectorNodes, { autoAlpha: 0.95, duration: 0.28, ease: "power2.out", stagger: 0.03 }, "vectorShift+=0.16")
          .to(introEchoes, { autoAlpha: 0.1, duration: 0.76, ease: "power2.inOut", xPercent: 12 }, "vectorShift+=0.18")
          .to(mathCosmos, { autoAlpha: 0.32, duration: 0.9, ease: "power2.inOut", y: 0 }, "vectorShift+=0.2")
          .to(manuscriptCanvas, { autoAlpha: 0.62, duration: 0.96, ease: "power3.inOut", scale: 0.992, x: 8, y: 3 }, "vectorShift+=0.28")
          .to(
            curtainElement,
            {
              clipPath: "polygon(0% 0%, 100% 0%, 92% 100%, 0% 100%)",
              duration: 1.08,
              ease: "power2.inOut",
            },
            "vectorShift+=0.16",
          )

          // ── Phase 4: LOCK TO HERO — Everything settles into scroll-ready state ──
          .addLabel("lockToHero", "vectorShift+=1.22")
          .to(introSlabs, { duration: 0.88, ease: "power3.inOut", stagger: 0.045, xPercent: 112 }, "lockToHero-=0.2")
          .to(introEchoes, { autoAlpha: 0, duration: 0.42, ease: "power2.out", xPercent: 20 }, "lockToHero-=0.06")
          .to(vectorLabels, { autoAlpha: 0, duration: 0.3, ease: "power2.out", y: -4, stagger: 0.035 }, "lockToHero-=0.1")
          .to(vectorNodes, { autoAlpha: 0, scale: 0.82, duration: 0.36, ease: "power2.out", stagger: 0.025 }, "lockToHero")
          .to(vectorPaths, { drawSVG: "78% 100%", autoAlpha: 0, duration: 0.62, ease: "power3.inOut", stagger: 0.035 }, "lockToHero+=0.02")
          .to(vectorSystem, { autoAlpha: 0, duration: 0.48, ease: "power2.out" }, "lockToHero+=0.22")
          .to(gridLayer, { autoAlpha: 1, duration: 0.84, ease: "power2.out" }, "lockToHero-=0.12")
          .to(mathCosmos, { autoAlpha: 1, duration: 0.92, ease: "power2.out" }, "lockToHero-=0.08")
          .to(manuscriptCanvas, { autoAlpha: 1, duration: 0.96, ease: "expo.out", scale: 1, x: 0, y: 0 }, "lockToHero-=0.04")
          // Letter-spacing rebounds from -0.015em back to final 0em
          .to(
            introTitleLines,
            {
              left: 0,
              top: 0,
              letterSpacing: "0em",
              duration: 0.92,
              ease: "expo.out",
            },
            "lockToHero",
          )
          .to(title, { autoAlpha: 1, duration: 0.24, ease: "power2.out" }, "lockToHero+=0.58")
          .to(introFrame, { autoAlpha: 0, duration: 0.46, ease: "power2.out", scaleX: 1.12 }, "lockToHero+=0.12")
          // Faster curtain exit for clean reveal
          .to(
            curtainElement,
            {
              clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 92% 100%)",
              autoAlpha: 0,
              duration: 0.68,
              ease: "power3.inOut",
            },
            "lockToHero+=0.18",
          )
          .to(introSurface, { autoAlpha: 0, duration: 0.5, ease: "power2.out" }, "lockToHero+=0.34")
          .to(missionActions, { autoAlpha: 1, duration: 0.56, ease: "power3.out", y: 0 }, "lockToHero+=0.82")
          .to(actionLinks, { autoAlpha: 1, duration: 0.5, ease: "power3.out", stagger: 0.08, y: 0 }, "lockToHero+=0.88")
          .to(readout, { autoAlpha: 0.82, duration: 0.56, ease: "power3.out", x: 0 }, "lockToHero+=1.08")
          .to(readoutLines, { autoAlpha: 1, duration: 0.46, ease: "power3.out", stagger: 0.07, x: 0 }, "lockToHero+=1.12");
      }, heroElement);

      const cleanup = () => {
        context.revert();
        storyElement.classList.remove(INTRO_ACTIVE_CLASS);
        document.body.classList.remove(INTRO_LOCK_CLASS);
      };
      curtainElement.dataset.introCleanup = "ready";
      (curtainElement as HTMLElement & { __formulaLabIntroCleanup?: () => void }).__formulaLabIntroCleanup = cleanup;
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      const cleanup = (curtainElement as HTMLElement & { __formulaLabIntroCleanup?: () => void }).__formulaLabIntroCleanup;
      cleanup?.();
      delete (curtainElement as HTMLElement & { __formulaLabIntroCleanup?: () => void }).__formulaLabIntroCleanup;
    };
  }, [heroRef]);

  return (
    <div className="brand-intro-curtain" aria-hidden="true" ref={curtainRef}>
      <span className="brand-intro-surface" />
      <span className="brand-intro-slab brand-intro-slab-left" />
      <span className="brand-intro-slab brand-intro-slab-center" />
      <span className="brand-intro-slab brand-intro-slab-right" />
      <span className="brand-intro-echo brand-intro-echo-one">FORMULA</span>
      <span className="brand-intro-echo brand-intro-echo-two">LAB</span>
      <svg className="brand-intro-vector-system" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path className="brand-intro-vector-path brand-intro-vector-path-main" d="M 6 14 H 34 C 43 14 47 27 55 27 H 94" />
        <path className="brand-intro-vector-path" d="M 8 82 H 36 C 48 82 52 66 64 66 H 92" />
        <path className="brand-intro-vector-path" d="M 18 20 V 72 M 82 22 V 78" />
        <path className="brand-intro-vector-path brand-intro-vector-path-fine" d="M 12 48 H 88 M 50 10 V 90" />
        <circle className="brand-intro-vector-node" cx="18" cy="20" r="0.72" />
        <circle className="brand-intro-vector-node" cx="50" cy="48" r="0.72" />
        <circle className="brand-intro-vector-node" cx="82" cy="78" r="0.72" />
        <circle className="brand-intro-vector-node" cx="55" cy="27" r="0.72" />
        <text className="brand-intro-vector-label" x="7" y="11">VECTOR LOCK</text>
        <text className="brand-intro-vector-label" x="68" y="86">TITLE ORBIT</text>
      </svg>
      <span className="brand-intro-frame" />
      <span className="brand-intro-beam" />
    </div>
  );
}
