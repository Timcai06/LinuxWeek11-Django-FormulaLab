import { expect, test } from "@playwright/test";

test.skip(process.env.E2E_VISUAL !== "1", "Set E2E_VISUAL=1 to run visual baselines.");

test.describe("Formula Lab visual baselines", () => {
  test.use({
    colorScheme: "dark",
    viewport: { width: 1440, height: 960 }
  });

  test("landing, workbench, history, and system keep their visual contracts", async ({ page }) => {
    await page.addInitScript(() => {
      window.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            scroll-behavior: auto !important;
          }
          .webgl-canvas-container,
          .shape-overlays,
          [data-flow-canvas] {
            visibility: hidden !important;
          }
        `;
        document.head.appendChild(style);
      });
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "FORMULA LAB" })).toBeVisible();
    await expect(page).toHaveScreenshot("landing.png", { maxDiffPixelRatio: 0.03 });

    await page.goto("/workbench/");
    await expect(page.getByRole("heading", { name: "WORKBENCH" })).toBeVisible();
    await expect(page).toHaveScreenshot("workbench.png", {
      mask: [page.locator(".recent-list"), page.locator(".status-readout"), page.locator(".queue-grid dd")],
      maxDiffPixelRatio: 0.03
    });

    await page.goto("/history/");
    await expect(page.getByRole("heading", { name: "RECOGNITION TIMELINE" })).toBeVisible();
    await expect(page).toHaveScreenshot("history.png", {
      mask: [page.locator(".timeline")],
      maxDiffPixelRatio: 0.03
    });

    await page.goto("/system/");
    await expect(page.getByRole("heading", { name: "OPERATIONS DASHBOARD" })).toBeVisible();
    await expect(page).toHaveScreenshot("system.png", {
      mask: [
        page.locator("[data-refresh-label]"),
        page.locator("[data-health-score]"),
        page.locator("[data-health-summary]"),
        page.locator("[data-queue-count]"),
        page.locator("[data-model-status]"),
        page.locator("[data-last-job-status]"),
        page.locator("[data-last-job-detail]")
      ],
      maxDiffPixelRatio: 0.03
    });
  });
});
