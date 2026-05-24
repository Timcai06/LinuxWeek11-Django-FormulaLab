import type { CSSProperties } from "react";

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

type ConstellationDepth = "far" | "mid" | "near";

type ConstellationFormula = {
  depth: ConstellationDepth;
  left: string;
  size: string;
  source: string;
  tilt: string;
  top: string;
};

type ConstellationStyle = CSSProperties & {
  "--constellation-tilt": string;
};

declare global {
  interface Window {
    katex?: KatexRuntime;
  }
}

const FORMULAS: ConstellationFormula[] = [
  {
    depth: "far",
    left: "4%",
    size: "clamp(1rem, 1.8vw, 1.4rem)",
    source: String.raw`\int_{\mathbb{R}^n} e^{-\pi x^\top A x}\,dx = (\det A)^{-1/2}`,
    tilt: "-8deg",
    top: "12%",
  },
  {
    depth: "mid",
    left: "13%",
    size: "clamp(1.4rem, 2.4vw, 2.1rem)",
    source: String.raw`\operatorname*{arg\,min}_{u \in \mathcal{U}}\left\{\int_0^T \ell(x_t,u_t)\,dt + \Phi(x_T)\right\}`,
    tilt: "4deg",
    top: "27%",
  },
  {
    depth: "near",
    left: "18%",
    size: "clamp(1.8rem, 3vw, 2.9rem)",
    source: String.raw`G_{\mu\nu} + \Lambda g_{\mu\nu} = \frac{8\pi G}{c^4}T_{\mu\nu}`,
    tilt: "-3deg",
    top: "62%",
  },
  {
    depth: "mid",
    left: "36%",
    size: "clamp(1.3rem, 2.3vw, 1.9rem)",
    source: String.raw`\sum_{k=0}^{\infty}\frac{(-1)^k x^{2k+1}}{(2k+1)!} = \sin x`,
    tilt: "6deg",
    top: "16%",
  },
  {
    depth: "far",
    left: "45%",
    size: "clamp(0.95rem, 1.7vw, 1.25rem)",
    source: String.raw`\nabla \times \mathbf{B} = \mu_0\mathbf{J} + \mu_0\epsilon_0 \frac{\partial \mathbf{E}}{\partial t}`,
    tilt: "-7deg",
    top: "39%",
  },
  {
    depth: "near",
    left: "51%",
    size: "clamp(1.7rem, 2.8vw, 2.6rem)",
    source: String.raw`\mathcal{L}(\theta) = \mathbb{E}_{(x,y)\sim\mathcal{D}}\left[\|f_\theta(x)-y\|_2^2 + \lambda \|\theta\|_1\right]`,
    tilt: "5deg",
    top: "72%",
  },
  {
    depth: "mid",
    left: "62%",
    size: "clamp(1.2rem, 2.2vw, 1.9rem)",
    source: String.raw`\forall \varepsilon > 0\ \exists \delta > 0:\ \|x-a\|<\delta \Rightarrow \|f(x)-L\|<\varepsilon`,
    tilt: "-4deg",
    top: "22%",
  },
  {
    depth: "near",
    left: "70%",
    size: "clamp(1.65rem, 2.7vw, 2.45rem)",
    source: String.raw`\hat{\beta} = (X^\top X + \lambda I)^{-1}X^\top y`,
    tilt: "-6deg",
    top: "49%",
  },
  {
    depth: "far",
    left: "79%",
    size: "clamp(0.92rem, 1.6vw, 1.2rem)",
    source: String.raw`\operatorname{KL}(q\|p)=\int q(z)\log\frac{q(z)}{p(z)}\,dz`,
    tilt: "7deg",
    top: "9%",
  },
  {
    depth: "mid",
    left: "82%",
    size: "clamp(1.25rem, 2.1vw, 1.75rem)",
    source: String.raw`\frac{d}{dt}\rho = -\frac{i}{\hbar}[H,\rho] + \sum_j \gamma_j\left(L_j \rho L_j^\dagger - \frac12\{L_j^\dagger L_j,\rho\}\right)`,
    tilt: "3deg",
    top: "66%",
  },
];

function renderFormulaMarkup(source: string): { __html: string } | null {
  if (typeof window === "undefined" || !window.katex) {
    return null;
  }

  try {
    const html = window.katex.renderToString(source, {
      displayMode: false,
      output: "html",
      strict: "ignore",
      throwOnError: false,
    });
    return html.trim() ? { __html: html } : null;
  } catch {
    return null;
  }
}

export function FormulaConstellationField() {
  return (
    <div className="math-cosmos formula-constellation" aria-hidden="true">
      {FORMULAS.map((formula) => {
        const markup = renderFormulaMarkup(formula.source);
        const style = {
          "--constellation-tilt": formula.tilt,
          fontSize: formula.size,
          left: formula.left,
          top: formula.top,
        } satisfies ConstellationStyle;

        return (
          <span
            className={`cosmos-item constellation-item constellation-item-${formula.depth}`}
            key={`${formula.source}-${formula.left}-${formula.top}`}
            style={style}
          >
            {markup ? <span dangerouslySetInnerHTML={markup} /> : formula.source}
          </span>
        );
      })}
    </div>
  );
}
