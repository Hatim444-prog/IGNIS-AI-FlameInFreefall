import { expect, test } from "@playwright/test";
test("live explorer selects a run and opens a sourced comparison", async ({
  page,
}) => {
  await page.goto("/experiments");
  const first = page.getByRole("checkbox").first();
  await first.check();
  await page.getByRole("link", { name: /Compare selected/ }).click();
  await page.getByRole("button", { name: "Compare measurements" }).click();
  await expect(
    page.getByRole("heading", { name: "Source measurements" }),
  ).toBeVisible({ timeout: 45000 });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await download).suggestedFilename()).toContain(".csv");
});
test("live mission scenario shows provenance groups and limits", async ({
  page,
}) => {
  await page.goto("/mission-advisor");
  await page.getByRole("button", { name: "Rank research" }).click();
  await expect(
    page.getByRole("heading", { name: "NASA investigations" }),
  ).toBeVisible({ timeout: 45000 });
  await expect(
    page.getByRole("heading", { name: "Related external research" }),
  ).toBeVisible();
});
test("empty, unavailable and recovered database responses", async ({
  page,
}) => {
  let status = 503;
  await page.route("**/ai/data/experiments?**", (r) =>
    r.fulfill({
      status,
      json:
        status === 503
          ? { detail: "Database unavailable" }
          : { experiments: [] },
    }),
  );
  await page.goto("/experiments");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("503");
  status = 200;
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("No matching records.")).toBeVisible();
});
test("offline API and mobile navigation", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.route("**/ai/**", (r) => r.abort());
  await page.goto("/");
  await expect(page.getByText("API offline")).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Media laboratory" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Media laboratory" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("all assistant modes send their expected payload and render evidence", async ({
  page,
}) => {
  await page.goto("/assistant");
  for (const [mode, path] of [
    ["Paper", "ask"],
    ["Hybrid", "ask-hybrid"],
    ["Multimodal", "ask-multimodal"],
  ]) {
    await page.route("**/ai/" + path, async (route) => {
      expect(route.request().postDataJSON().question).toBe(
        "What evidence is available?",
      );
      await route.fulfill({
        json: {
          answer: "Test answer for " + mode,
          paper_sources: [{ file: "test.pdf", page: 2 }],
        },
      });
    });
    await page.getByRole("button", { name: new RegExp("^" + mode) }).click();
    await page
      .getByLabel("Research question")
      .fill("What evidence is available?");
    await page.getByRole("button", { name: "Send question" }).click();
    await expect(page.getByText("Test answer for " + mode)).toBeVisible();
  }
  await expect(page.getByText("test.pdf · p. 2")).toHaveCount(3);
});
test("upload analyze and save remain separate and search handles empty results", async ({
  page,
}) => {
  await page.goto("/media");
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  for (const [action, path, saved] of [
    ["Analyze only", "image", false],
    ["Analyze and save", "store-image", true],
  ] as const) {
    await page.route("**/ai/vision/" + path, (route) => {
      expect(route.request().headers()["content-type"]).toContain(
        "multipart/form-data",
      );
      return route.fulfill({
        json: {
          file_name: "test.png",
          description: "Test observation",
          persisted_to_database: saved,
        },
      });
    });
    await page.getByRole("button", { name: action }).click();
    await expect(
      page.getByText(saved ? "Saved · Unverified" : "Analysis only", {
        exact: true,
      }),
    ).toBeVisible();
  }
  await page.route("**/ai/vision/search?**", (r) =>
    r.fulfill({ json: { results: [] } }),
  );
  await page.getByRole("link", { name: "Search visual evidence" }).click();
  await page
    .getByLabel("Describe a visual observation")
    .fill("test observation");
  await page.getByRole("button", { name: "Search library" }).click();
  await expect(
    page.getByText("No matching visual observations."),
  ).toBeVisible();
});
