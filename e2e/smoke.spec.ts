import { expect, test } from "@playwright/test";

test.describe("Formula Lab smoke flow", () => {
  test("opens the landing, workbench, history, and system surfaces", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "FORMULA LAB" })).toBeVisible();

    await page.getByRole("link", { name: "ENTER WORKBENCH" }).click();
    await expect(page.getByRole("heading", { name: "WORKBENCH" })).toBeVisible();
    await expect(page.locator("input[type='file']")).toBeAttached();

    await page.getByRole("link", { name: "MISSION LOG" }).click();
    await expect(page.getByRole("heading", { name: "RECOGNITION TIMELINE" })).toBeVisible();

    await page.getByRole("link", { name: "SYSTEM" }).click();
    await expect(page.getByRole("heading", { name: "OPERATIONS DASHBOARD" })).toBeVisible();
    await expect(page.locator("[data-warmup-button]")).toBeVisible();
    await expect(page.locator("[data-queue-control-button]")).toBeVisible();
  });
});
