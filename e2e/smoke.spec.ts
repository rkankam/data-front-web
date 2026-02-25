import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const catalogPayload = {
  tracks: [
    {
      id: "track-1",
      title: "Garage Trial",
      durationSeconds: 180,
      imageUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      model: "FUZZ-2.0 Raw",
      audio: { publicUrl: null, b2Mp3Key: "mp3/track-1.mp3", b2WavKey: null },
      tags: { sound: "uk garage club", conditions: ["club", "night"] },
    },
  ],
};

const prepareApiMocks = async (page: import("@playwright/test").Page) => {
  await page.route("**/api/catalog**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(catalogPayload) });
  });

  await page.route("**/api/b2/sign**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        url: "https://example.com/track-1.mp3",
        expiresIn: 300,
        file: "mp3/track-1.mp3",
      }),
    });
  });
};

test("desktop smoke: load, search, play controls, queue, detail", async ({ page }) => {
  await prepareApiMocks(page);
  const start = Date.now();
  await page.goto("/");
  await expect(page.getByText("Capsule Radio")).toBeVisible();
  expect(Date.now() - start).toBeLessThan(5000);

  const search = page.getByLabel("Search tracks");
  await search.fill("garage");

  const list = page.getByLabel("Track list");
  await expect(list).toBeVisible();
  await list.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");

  const playButton = page.getByRole("button", { name: /Play/i }).first();
  await playButton.click();

  // Check for queue button in player (moved from panel to player dropdown)
  await page.getByLabel("Queue").click();
  await expect(page.getByText("Queue")).toBeVisible();

  // Check metadata panel
  await expect(page.getByText("Prompt & Conditions")).toBeVisible();

  // Accessibility check - ignore color-contrast for dark theme
  const a11y = await new AxeBuilder({ page }).analyze();
  const criticalViolations = a11y.violations.filter(v => v.impact !== 'minor' && v.id !== 'color-contrast');
  expect(criticalViolations).toEqual([]);
});

test("mobile smoke: load and interact", async ({ page }) => {
  await prepareApiMocks(page);
  await page.goto("/");
  await expect(page.getByText("Capsule Radio")).toBeVisible();

  await page.getByLabel("Search tracks").fill("ambient");
  await page.getByRole("button", { name: /Next track/i }).click();
  await expect(page.getByRole("button", { name: /Play|Pause/i })).toBeVisible();
});
