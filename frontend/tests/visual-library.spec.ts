import { expect, test } from "@playwright/test";

test("live visual search responds through the frontend proxy", async ({
  page,
}) => {
  test.skip(
    !process.env.IGNIS_LIVE_VISUAL,
    "Requires the live API and database",
  );
  await page.goto("/media/library");
  await page
    .getByLabel("Describe a visual observation")
    .fill("spherical blue flame");
  const response = page.waitForResponse((r) =>
    r.url().includes("/ai/vision/search?"),
  );
  await page
    .getByRole("button", { name: "Search library", exact: true })
    .click();
  const result = await response;
  expect(result.status()).toBe(200);
  const data = await result.json();
  expect(["empty", "semantic", "keyword"]).toContain(data.search_mode);
  if (data.total_observations === 0) {
    await expect(
      page.getByText("No saved visual observations yet."),
    ).toBeVisible();
  } else {
    const preview = page.locator("article.sample img").first();
    await expect(preview).toBeVisible();
    await expect.poll(() => preview.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  }
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.screenshot({
    path: "../artifacts/ux-review/visual-library-live.png",
    fullPage: true,
  });
});

test("visual library distinguishes an empty collection and search failures", async ({
  page,
}) => {
  let fail = false;
  await page.route("**/ai/vision/search?**", (route) =>
    route.fulfill(
      fail
        ? { status: 503, json: { detail: "Database unavailable" } }
        : {
            json: { results: [], total_observations: 0, search_mode: "empty" },
          },
    ),
  );
  await page.route("**/ai/health", (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.goto("/media/library");
  await page
    .getByLabel("Describe a visual observation")
    .fill("spherical flame");
  await page
    .getByRole("button", { name: "Search library", exact: true })
    .click();
  await expect(
    page.getByText("No saved visual observations yet."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Add visual evidence" }),
  ).toHaveAttribute("href", "/media");
  fail = true;
  await page
    .getByRole("button", { name: "Search library", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("temporarily unavailable");
  fail = false;
  await page.getByRole("button", { name: "Retry search" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page.getByText("No saved visual observations yet."),
  ).toBeVisible();
});

test("visual library displays descriptions, review and source status, linkage, and fallback", async ({
  page,
}) => {
  await page.route("**/ai/health", (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.route("**/ai/vision/search?**", (route) =>
    route.fulfill({
      json: {
        search_mode: "keyword",
        total_observations: 2,
        warnings: [
          "Semantic search unavailable. Showing keyword matches instead.",
        ],
        results: [
          {
            observation_id: 1,
            filename: "flame.png",
            model_name: "internal-model-name",
            local_path: "internal/storage/path.png",
            description: "A spherical blue flame.",
            review_status: "pending_review",
            verification_status: "unverified",
            experiment_code: "ZARM-147",
            investigation_code: "ZARM-FLARE",
            similarity: null,
          },
          {
            observation_id: 2,
            filename: "reviewed.png",
            description: "An elongated flame.",
            review_status: "reviewed",
            verification_status: "verified",
            experiment_code: null,
            similarity: null,
          },
        ],
      },
    }),
  );
  await page.goto("/media/library");
  await page.getByLabel("Describe a visual observation").fill("flame");
  await page
    .getByRole("button", { name: "Search library", exact: true })
    .click();
  await expect(
    page
      .locator("article.sample > p")
      .filter({ hasText: /^A spherical blue flame\.$/ }),
  ).toBeVisible();
  await expect(
    page.getByText("Review: pending review · Source verification: unverified"),
  ).toBeVisible();
  await expect(
    page
      .locator("article.sample > p")
      .getByRole("link", { name: "ZARM-147", exact: true }),
  ).toHaveAttribute("href", "/experiments/ZARM-147");
  await expect(page.getByText("No experiment linked.")).toBeVisible();
  await expect(page.getByText("internal-model-name", { exact: true })).toHaveCount(0);
  await expect(page.getByText("internal/storage/path.png", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Semantic search unavailable. Showing keyword matches instead.")).toHaveCount(0);
  await page.getByLabel("Review status").selectOption("reviewed");
  await expect(
    page.getByRole("heading", { name: "flame.png", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "reviewed.png", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Verification", { exact: false })
    .selectOption("unverified");
  await expect(
    page.getByText("No observations match these status filters."),
  ).toBeVisible();
});
