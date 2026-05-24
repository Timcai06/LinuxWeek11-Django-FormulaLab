import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";

type KatexRuntime = {
  renderToString: (
    source: string,
    options: {
      displayMode: boolean;
      output: "html";
      strict: "ignore";
      throwOnError: boolean;
    },
  ) => string;
};

declare global {
  interface Window {
    katex?: KatexRuntime;
  }
}

const EQUATIONS = [
  String.raw`\oint_{\partial\Omega}\omega=\int_{\Omega}d\omega`,
  String.raw`\mathcal{F}\{e^{-\pi x^2}\}=e^{-\pi \xi^2}`,
  String.raw`i\hbar\frac{\partial\psi}{\partial t}=\hat{H}\psi`,
  String.raw`\nabla_\mu F^{\mu\nu}=\mu_0J^\nu`,
  String.raw`\det(\lambda I-A)=0`,
  String.raw`\zeta(s)=\prod_p(1-p^{-s})^{-1}`,
  String.raw`\Delta x\,\Delta p\ge\frac{\hbar}{2}`,
  String.raw`\mathcal{L}=\bar\psi(i\gamma^\mu D_\mu-m)\psi`,
  String.raw`\int_\Gamma f(z)\,dz=2\pi i\sum \operatorname{Res}(f,a_k)`,
  String.raw`R_{\mu\nu}-\frac12Rg_{\mu\nu}+\Lambda g_{\mu\nu}=\frac{8\pi G}{c^4}T_{\mu\nu}`,
  String.raw`\mathbf{A}=U\Sigma V^\top`,
  String.raw`H(X)=-\sum_x p(x)\log_2p(x)`,
];

type CosmosItem = {
  xTo: (value: number) => void;
  yTo: (value: number) => void;
  speedFactor: number;
};

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

function layerStyle(layer: number) {
  switch (layer) {
    case 1:
      return { blur: "14px", opacity: "0.05", size: "6.4rem", speedFactor: -0.15 };
    case 2:
      return { blur: "7px", opacity: "0.08", size: "4.2rem", speedFactor: -0.09 };
    case 3:
      return { blur: "1px", opacity: "0.18", size: "2.3rem", speedFactor: 0.055 };
    case 4:
      return { blur: "0.4px", opacity: "0.22", size: "1.7rem", speedFactor: 0.035 };
    case 5:
      return { blur: "0px", opacity: "0.34", size: "1.15rem", speedFactor: -0.015 };
    default:
      return { blur: "0px", opacity: "0.48", size: "0.78rem", speedFactor: -0.005 };
  }
}

function renderFormula(equation: string): string {
  return window.katex?.renderToString(equation, {
    displayMode: false,
    output: "html",
    strict: "ignore",
    throwOnError: false,
  }) ?? "";
}

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const cosmosRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const heroElement = heroRef.current;
    const cosmosElement = cosmosRef.current;
    if (!heroElement || !cosmosElement) {
      return undefined;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cosmosItems: CosmosItem[] = [];

    EQUATIONS.concat(EQUATIONS.slice(0, 10)).forEach((equation, index) => {
      const item = document.createElement("div");
      const layer = (index % 6) + 1;
      const style = layerStyle(layer);

      item.className = "cosmos-item";
      item.innerHTML = renderFormula(equation);
      item.style.left = `${(index * 37) % 96}%`;
      item.style.top = `${(index * 53) % 94}%`;
      item.style.filter = `blur(${style.blur})`;
      item.style.opacity = style.opacity;
      item.style.fontSize = style.size;
      cosmosElement.appendChild(item);

      cosmosItems.push({
        speedFactor: style.speedFactor,
        xTo: gsap.quickTo(item, "x", { duration: reduceMotion ? 0 : 0.8, ease: "power3.out" }),
        yTo: gsap.quickTo(item, "y", { duration: reduceMotion ? 0 : 0.8, ease: "power3.out" }),
      });
    });

    const intro = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(".mission-kicker, .glitch-title, .mission-subtitle, .mission-actions", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 })
        .fromTo(".glitch-title", { letterSpacing: "0.06em" }, { letterSpacing: "0", duration: 0.8 }, "-=0.45")
        .fromTo(".readout-line", { autoAlpha: 0, x: 12 }, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.12 }, "-=0.35");
    }, heroElement);

    const handleMouseMove = (event: MouseEvent) => {
      const offsetX = event.clientX - window.innerWidth / 2;
      const offsetY = event.clientY - window.innerHeight / 2;
      document.documentElement.style.setProperty("--mouse-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${event.clientY}px`);
      cosmosItems.forEach((item) => {
        item.xTo(offsetX * item.speedFactor);
        item.yTo(offsetY * item.speedFactor);
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.style.removeProperty("--mouse-x");
      document.documentElement.style.removeProperty("--mouse-y");
      intro.revert();
      cosmosElement.replaceChildren();
    };
  }, []);

  return (
    <>
      <div className="grid-bg-layer" aria-hidden="true">
        <div className="hero-scanline" aria-hidden="true" />
        <div className="math-cosmos" ref={cosmosRef} aria-hidden="true" />
        <div className="shooting-stars" aria-hidden="true">
          {STAR_STYLES.map((style, index) => (
            <div className="shooting-star" style={style} key={index} />
          ))}
        </div>
      </div>

      <section className="landing-hero" ref={heroRef}>
        <div className="landing-copy">
          <div className="hud-corners" aria-hidden="true" />
          <p className="mission-kicker">OPTICAL FORMULA RECOGNITION</p>
          <h1 className="glitch-title">FORMULA LAB</h1>
          <p className="mission-subtitle">MISSION CONTROL FOR LATEX RECOGNITION</p>
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
