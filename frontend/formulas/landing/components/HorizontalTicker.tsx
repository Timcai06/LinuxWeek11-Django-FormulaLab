import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const COPY = "FORMULA LAB • EXTRACTING INTELLIGENCE FROM HISTORY • COMPUTING THE FUTURE •";

export function HorizontalTicker() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const wrapper = sectionRef.current;
    const text = textRef.current;
    if (!wrapper || !text) return;

    const ctx = gsap.context(() => {
      // Exactly like the CodePen: slide the text left by 100% of its width
      const scrollTween = gsap.to(text, {
        xPercent: -100,
        ease: "none",
        scrollTrigger: {
          trigger: wrapper,
          pin: true,
          start: "top top",
          end: "+=5000",
          scrub: true,
        },
      });

      // Select all the split characters
      const chars = text.querySelectorAll<HTMLElement>(".ht-char");

      chars.forEach((char) => {
        gsap.from(char, {
          yPercent: gsap.utils.random(-200, 200),
          rotation: gsap.utils.random(-20, 20),
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: char,
            containerAnimation: scrollTween,
            start: "left 100%",
            end: "left 30%",
            scrub: 1,
          },
        });
      });
    }, wrapper);

    return () => ctx.revert();
  }, []);

  return (
    <section className="ht-section" ref={sectionRef}>
      <div className="ht-track">
        <h3 className="ht-text" ref={textRef}>
          {COPY.split("").map((char, i) => (
            <span
              key={i}
              className="ht-char"
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </h3>
      </div>
    </section>
  );
}
