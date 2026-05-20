import { expect, test } from "@playwright/test";

const courseImages = [
  "../linux2026/大实验2/测试用图片/formular1.png",
  "../linux2026/大实验2/测试用图片/formular2.png",
  "../linux2026/大实验2/测试用图片/formular3.png",
  "../linux2026/大实验2/测试用图片/formular4.png"
];

test.describe("Formula Lab real-model flow", () => {
  for (const imagePath of courseImages) {
    test(`recognizes ${imagePath}`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

      await page.goto("/");
      await expect(page.getByRole("heading", { name: "FORMULA LAB" })).toBeVisible();
      await page.getByRole("link", { name: "ENTER WORKBENCH" }).click();

      await expect(page.getByRole("heading", { name: "WORKBENCH" })).toBeVisible();
      await page.locator("input[type='file']").setInputFiles(imagePath);
      await expect(page.locator("[data-preview-wrap]")).toBeVisible();

      await page.getByRole("button", { name: "START RECOGNITION" }).click();
      await expect(page).toHaveURL(/\/missions\/[0-9a-f-]+\/progress\/$/);
      await expect(page.getByRole("heading", { name: "RECOGNITION PROGRESS" })).toBeVisible();

      await expect(page.locator("[data-status]")).toHaveText("SUCCEEDED", { timeout: 170_000 });
      await page.getByRole("link", { name: "OPEN REPORT" }).click();

      await expect(page.getByRole("heading", { name: "ORIGINAL IMAGE" })).toBeVisible();
      await expect(page.locator("[data-latex-output]")).not.toHaveValue("");

      for (const tabName of ["RAW", "BLOCK", "INLINE"]) {
        await page.getByRole("button", { name: tabName }).click();
        await expect(page.locator("[data-latex-output]")).not.toHaveValue("");
      }

      await expect(page.locator("[data-paper-fit-preview]")).toBeVisible();
      await expect(page.locator("[data-paper-fit-width]")).not.toHaveText("--");
      await expect(page.locator("[data-paper-fit-lines]")).not.toHaveText("--");

      await page.getByRole("button", { name: "COPY" }).click();
      await expect(page.getByRole("button", { name: "COPIED" })).toBeVisible();

      await page.locator(".console-actions").getByRole("link", { name: "LOG" }).click();
      await expect(page.getByRole("heading", { name: "RECOGNITION TIMELINE" })).toBeVisible();

      await page.getByRole("link", { name: "SYSTEM" }).click();
      await expect(page.getByRole("heading", { name: "OPERATIONS DASHBOARD" })).toBeVisible();
      await expect(page.getByRole("button", { name: "WARMUP MODEL" })).toBeVisible();
    });
  }
});
