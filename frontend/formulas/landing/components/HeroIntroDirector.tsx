import { useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import gsap from "gsap";

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
      const actionLinks = Array.from(heroElement.querySelectorAll<HTMLElement>(".mission-actions .button"));
      const readoutLines = Array.from(heroElement.querySelectorAll<HTMLElement>(".readout-line"));
      const introBeam = curtainElement.querySelector<HTMLElement>(".brand-intro-beam");
      const introFrame = curtainElement.querySelector<HTMLElement>(".brand-intro-frame");
      if (!title) {
        storyElement.classList.remove(INTRO_ACTIVE_CLASS);
        storyElement.classList.add(INTRO_COMPLETE_CLASS);
        document.body.classList.remove(INTRO_LOCK_CLASS);
        return;
      }

      const titleTargets = titleChars.length > 0 ? titleChars : titleLines;
      const context = gsap.context(() => {
        const cleanupTargets = [curtainElement, title, ...titleLines, ...titleChars, ...actionLinks, ...readoutLines];
        gsap.set(curtainElement, {
          autoAlpha: 1,
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          xPercent: 0,
        });
        gsap.set(introBeam, { autoAlpha: 0, xPercent: -120 });
        gsap.set(introFrame, { autoAlpha: 0, scaleX: 0.42, transformOrigin: "50% 50%" });
        gsap.set(title, {
          autoAlpha: 0,
          x: "16vw",
          y: "17vh",
          scale: 0.78,
          force3D: false,
          transformOrigin: "0% 50%",
        });
        gsap.set(titleLines, { clipPath: "inset(100% 0% 0% 0%)", force3D: false, y: 28, opacity: 0 });
        gsap.set(actionLinks, { autoAlpha: 0, y: 18 });
        gsap.set(readoutLines, { autoAlpha: 0, x: 16 });

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
          .addLabel("blackout", 0)
          .to(title, { autoAlpha: 1, duration: 0.36, ease: "none" }, "blackout+=0.2")
          .to(
            titleLines,
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 0.82,
              ease: "power4.out",
              opacity: 1,
              stagger: 0.13,
              y: 0,
            },
            "blackout+=0.36",
          )
          .fromTo(
            titleTargets,
            { opacity: 0.28, y: 18 },
            {
              duration: 0.92,
              ease: "power3.out",
              force3D: false,
              opacity: 1,
              stagger: { each: 0.016, from: "center" },
              y: 0,
            },
            "blackout+=0.4",
          )
          .to(introFrame, { autoAlpha: 0.56, duration: 0.52, ease: "power2.out", scaleX: 1 }, "blackout+=0.58")
          .addLabel("vectorShift", "blackout+=1.18")
          .to(title, { x: "8vw", y: "9vh", scale: 0.88, duration: 1.04, ease: "power2.inOut", force3D: false }, "vectorShift")
          .to(introBeam, { autoAlpha: 1, duration: 0.28, ease: "power2.out" }, "vectorShift+=0.05")
          .to(introBeam, { xPercent: 120, duration: 1.08, ease: "power2.inOut" }, "vectorShift+=0.08")
          .to(
            curtainElement,
            {
              clipPath: "polygon(0% 0%, 100% 0%, 92% 100%, 0% 100%)",
              duration: 1.08,
              ease: "power2.inOut",
            },
            "vectorShift+=0.06",
          )
          .addLabel("lockToHero", "vectorShift+=0.96")
          .to(title, { x: 0, y: 0, scale: 1, duration: 1.12, ease: "expo.out", force3D: false }, "lockToHero")
          .to(introFrame, { autoAlpha: 0, duration: 0.46, ease: "power2.out", scaleX: 1.12 }, "lockToHero+=0.12")
          .to(
            curtainElement,
            {
              clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 92% 100%)",
              autoAlpha: 0,
              duration: 0.98,
              ease: "power3.inOut",
            },
            "lockToHero+=0.18",
          )
          .to(actionLinks, { autoAlpha: 1, duration: 0.54, ease: "power3.out", stagger: 0.08, y: 0 }, "lockToHero+=0.86")
          .to(readoutLines, { autoAlpha: 1, duration: 0.46, ease: "power3.out", stagger: 0.07, x: 0 }, "lockToHero+=1.02");
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
      <span className="brand-intro-frame" />
      <span className="brand-intro-beam" />
    </div>
  );
}
