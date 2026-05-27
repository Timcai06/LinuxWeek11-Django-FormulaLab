import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

import { createRafThrottledPointerWriter } from "../performance/raf";
import { HeroIntroDirector } from "./HeroIntroDirector";
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

    const pointerWriter = createRafThrottledPointerWriter({
      target: document.documentElement,
      xVar: "--mouse-x",
      yVar: "--mouse-y",
    });
    const handleMouseMove = (event: MouseEvent) => pointerWriter.schedule(event);

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      pointerWriter.cancel();
      document.documentElement.style.removeProperty("--mouse-x");
      document.documentElement.style.removeProperty("--mouse-y");
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
          <SplitTextTitleSequence animateOnMount={false} />
          <div className="hud-corners" aria-hidden="true" />
          <div className="hero-title-stack">
            <h1 className="glitch-title" data-split-title="headline">
              <span className="title-line title-line-formula">FORMULA</span>
              <span className="title-line title-line-lab">LAB</span>
            </h1>
          </div>
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
          <span className="readout-line">MANUSCRIPT GRAVITY ONLINE</span>
          <span className="readout-line">REVIEW INBOX PRIMED</span>
          <span className="readout-line">COLLABORATION LAYER READY</span>
        </div>
      </section>
      <HeroIntroDirector heroRef={heroRef} />
    </>
  );
}
