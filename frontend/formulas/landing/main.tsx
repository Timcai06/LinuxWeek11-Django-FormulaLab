import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { LandingApp } from "./LandingApp";
import "./styles/landing.css";

const root = document.getElementById("landing-root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <LandingApp />
    </StrictMode>,
  );
}
