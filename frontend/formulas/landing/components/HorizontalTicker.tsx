import type { CSSProperties } from "react";
import type { ScrollProgressRef } from "../types";

const COPY = "FORMULA LAB • EXTRACTING INTELLIGENCE FROM HISTORY • COMPUTING THE FUTURE •";

export function HorizontalTicker({ scrollProgressRef: _scrollProgressRef }: { scrollProgressRef: ScrollProgressRef }) {
  return (
    <div className="ht-section" aria-hidden="true">
      <div className="ht-track">
        <h3 className="ht-text">
          {COPY.split("").map((char, i) => (
            <span
              key={i}
              className="ht-char"
              style={{
                "--char-drift": `${((i % 7) - 3) * 18}px`,
                "--char-rotation": `${((i % 9) - 4) * 2.6}deg`,
              } as CSSProperties}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </h3>
      </div>
    </div>
  );
}
