import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";

import { SplitTextTitleSequence } from "./SplitTextTitleSequence";

type StarStyle = CSSProperties & {
  "--star-delay": string;
  "--star-length": string;
  "--star-speed": string;
};

const STAR_STYLES: StarStyle[] = [
  { top: "5%", right: "10%", "--star-length": "130px", "--star-speed": "7s", "--star-delay": "0s" },
  { top: "20%", right: "30%", "--star-length": "80px", "--star-speed": "9s", "--star-delay": "2.5s" },
  { top: "12%", right: "50%", "--star-length": "110px", "--star-speed": "11s", "--star-delay": "4s" },
  { top: "35%", right: "25%", "--star-length": "95px", "--star-speed": "8s", "--star-delay": "1.5s" },
  { top: "15%", right: "70%", "--star-length": "140px", "--star-speed": "13s", "--star-delay": "6.2s" },
];

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const heroElement = heroRef.current;
    if (!heroElement) {
      return undefined;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const intro = reduceMotion
      ? null
      : gsap.context(() => {
          gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .fromTo(".mission-kicker, .mission-actions", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.12 })
            .fromTo(".glitch-title", { letterSpacing: "0.06em" }, { letterSpacing: "0", duration: 0.8 }, "-=0.38")
            .fromTo(".readout-line", { autoAlpha: 0, x: 12 }, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.12 }, "-=0.28");
        }, heroElement);

    const handleMouseMove = (event: MouseEvent) => {
      document.documentElement.style.setProperty("--mouse-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${event.clientY}px`);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.style.removeProperty("--mouse-x");
      document.documentElement.style.removeProperty("--mouse-y");
      intro?.revert();
    };
  }, []);

  return (
    <>
      <div className="grid-bg-layer" aria-hidden="true">
        <div className="hero-scanline" aria-hidden="true" />
        <div className="shooting-stars" aria-hidden="true">
          {STAR_STYLES.map((style, index) => (
            <div className="shooting-star" style={style} key={index} />
          ))}
        </div>
      </div>

      <section className="landing-hero" ref={heroRef}>
        <div className="landing-copy">
          <SplitTextTitleSequence />
          <div className="hud-corners" aria-hidden="true" />
          <p className="mission-kicker">OPTICAL FORMULA RECOGNITION</p>
          <h1 className="glitch-title" data-split-title="headline">
            FORMULA LAB
          </h1>
          <p className="mission-subtitle" data-split-title="subtitle">
            MISSION CONTROL FOR LATEX RECOGNITION
          </p>
          <div className="mission-actions">
            <a className="button button-primary" href="/workbench/">
              ENTER WORKBENCH
            </a>
            <a className="button button-secondary" href="/history/">
              VIEW MISSION LOG
            </a>
          </div>
        </div>
        <div className="landing-readout" aria-label="System readout">
          <span className="readout-line">SCAN GRID ACTIVE</span>
          <span className="readout-line">LATEX TELEMETRY ONLINE</span>
          <span className="readout-line">IMAGE INPUT READY</span>
        </div>
      </section>
    </>
  );
}
