export type FormulaMotionStyle = "scan-lift-spectrum" | "field-lines" | "probability-wave" | "inference-grid";

export type FormulaChapter = {
  id: string;
  label: string;
  formula: string;
  author: string;
  era: string;
  uvBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  motion: FormulaMotionStyle;
  origin: string;
  conflict: string;
  legacy: string;
  productLink: string;
  sources: Array<{
    label: string;
    url: string;
  }>;
};

export const formulaChapters: FormulaChapter[] = [
  {
    id: "euler-identity",
    label: "Chapter 01",
    formula: "e^{i\\pi}+1=0",
    author: "Leonhard Euler",
    era: "18th century",
    uvBounds: { x: 0.18, y: 0.18, width: 0.24, height: 0.08 },
    motion: "scan-lift-spectrum",
    origin: "A compact bridge between exponential growth, rotation, and the geometry of complex numbers.",
    conflict: "Mathematicians needed one language for curves, cycles, and imaginary quantities that did not feel like separate worlds.",
    legacy: "The identity became a symbol of mathematical compression: several fundamental constants meeting in one line.",
    productLink: "Formula Lab treats this kind of dense notation as a reviewable object, not a dead image.",
    sources: [{ label: "MacTutor History of Mathematics", url: "https://mathshistory.st-andrews.ac.uk/" }],
  },
  {
    id: "fourier-transform",
    label: "Chapter 02",
    formula: "\\hat f(\\xi)=\\int_{-\\infty}^{\\infty}f(x)e^{-2\\pi ix\\xi}\\,dx",
    author: "Joseph Fourier",
    era: "early 19th century",
    uvBounds: { x: 0.48, y: 0.2, width: 0.34, height: 0.1 },
    motion: "field-lines",
    origin: "Fourier's heat work turned changing signals into mixtures of waves.",
    conflict: "A physical process that looked continuous and messy could be explained by decomposing it into repeatable components.",
    legacy: "Modern audio, imaging, compression, scientific computing, and AI tooling still inherit this spectral way of seeing.",
    productLink: "Formula Lab should preserve the line of reasoning around a formula, not only the LaTeX string.",
    sources: [{ label: "MacTutor History of Mathematics", url: "https://mathshistory.st-andrews.ac.uk/" }],
  },
  {
    id: "schrodinger-equation",
    label: "Chapter 03",
    formula: "i\\hbar\\frac{\\partial}{\\partial t}\\Psi=\\hat H\\Psi",
    author: "Erwin Schroedinger",
    era: "1926",
    uvBounds: { x: 0.18, y: 0.55, width: 0.32, height: 0.08 },
    motion: "probability-wave",
    origin: "The equation made quantum state evolution feel like a wave with measurable consequences.",
    conflict: "Classical trajectories could not describe atomic behavior, so physics needed a new mathematical surface for probability.",
    legacy: "Quantum chemistry, materials science, semiconductors, and computation still orbit this equation.",
    productLink: "A paper workspace should let authors inspect the formula and the explanatory context together.",
    sources: [{ label: "Nobel Prize", url: "https://www.nobelprize.org/" }],
  },
  {
    id: "bayes-rule",
    label: "Chapter 04",
    formula: "P(A\\mid B)=\\frac{P(B\\mid A)P(A)}{P(B)}",
    author: "Thomas Bayes",
    era: "18th century",
    uvBounds: { x: 0.52, y: 0.68, width: 0.3, height: 0.08 },
    motion: "inference-grid",
    origin: "Bayesian reasoning reframed belief as something that can be updated by evidence.",
    conflict: "Researchers needed a disciplined way to move from uncertain observation to revised confidence.",
    legacy: "Statistical learning, scientific inference, diagnostics, and many AI systems rely on this update logic.",
    productLink: "Formula Lab can turn recognized formulas into traceable review decisions inside a paper workflow.",
    sources: [{ label: "Stanford Encyclopedia of Philosophy", url: "https://plato.stanford.edu/" }],
  },
];
