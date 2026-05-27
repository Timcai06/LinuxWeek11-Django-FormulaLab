import { useEffect, useRef } from "react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";

import { REAL_GREEN_COPY_VISIBILITY_RANGES } from "../storyChoreography";
import type { ScrollProgressRef } from "../types";
import { getLandingMotionRuntime } from "../performance/motionRuntime";

export function LandingFlowCanvas({ scrollProgressRef }: { scrollProgressRef: ScrollProgressRef }) {
  const pathRef = useRef<SVGPathElement>(null);
  const glowPathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!pathRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    gsap.registerPlugin(DrawSVGPlugin);
    
    // Initialize
    gsap.set([pathRef.current, glowPathRef.current], { drawSVG: "0% 0%" });

    const update = (progress = scrollProgressRef.current) => {
      
      const flowStart = REAL_GREEN_COPY_VISIBILITY_RANGES[0]![0]; // 0.650
      const flowEnd = 1.0; // Absolute end of the landing page
      
      // Calculate normalized progress between the start of the green screen and the absolute bottom
      const flowProgress = gsap.utils.clamp(0, 1, (progress - flowStart) / (flowEnd - flowStart));
      
      if (flowProgress > 0) {
        // Add a slight offset (0.12) so the drawing tip stays near the bottom of the viewport 
        // as the user natively scrolls down the page.
        const drawPercent = Math.min(100, (flowProgress + 0.12) * 100);
        
        // Dynamic color transition synced with the black curtain, but drawn out over a longer 
        // scroll duration (0.835 to 0.885) so it feels like a slow, organic "power up" 
        // rather than an abrupt switch. It uses a power2.inOut ease for smoothness.
        const colorStart = 0.835;
        const colorEnd = 0.885;
        const colorPhaseRaw = gsap.utils.clamp(0, 1, (progress - colorStart) / (colorEnd - colorStart));
        const colorPhase = gsap.parseEase("power2.inOut")(colorPhaseRaw);
        
        // Morph the stroke from ink black to glowing green
        const strokeColor = gsap.utils.interpolate("#000000", "#5cffb0", colorPhase);
        
        // Target both the core path and the thickened glow path
        gsap.set([pathRef.current, glowPathRef.current], { 
          drawSVG: `0% ${drawPercent}%`,
          stroke: strokeColor,
        });
      } else {
        gsap.set([pathRef.current, glowPathRef.current], { drawSVG: "0% 0%" });
      }
    };

    update();
    const runtime = getLandingMotionRuntime();
    const unsubscribe = runtime.subscribeRenderer({
      id: "landing-flow-canvas",
      phases: ["greenCopy", "blackCurtain", "letterStorm", "cta"],
    }, (frame) => update(frame.progress));

    return () => {
      unsubscribe();
    };
  }, [scrollProgressRef]);

  return (
    <svg className="landing-flow-canvas" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {/* Glow path: Drawn identically, but wider and semi-transparent. 
          This avoids EXTREMELY expensive drop-shadow computations that cause flickering */}
      <path
        ref={glowPathRef}
        className="landing-flow-path-glow"
        d="M 80,0 C 80,10 70,20 60,25 C 40,30 95,35 85,45 C 70,60 10,65 15,75 C 20,82 5,85 30,88 C 50,92 85,95 85,100"
        vectorEffect="non-scaling-stroke"
      />
      {/* Core path */}
      <path
        ref={pathRef}
        className="landing-flow-path"
        d="M 80,0 C 80,10 70,20 60,25 C 40,30 95,35 85,45 C 70,60 10,65 15,75 C 20,82 5,85 30,88 C 50,92 85,95 85,100"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
