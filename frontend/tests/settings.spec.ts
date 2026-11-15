import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/ai/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/ai/health")
      return route.fulfill({
        json: {
          status: "ok",
          text_model: "test",
          vision_model: "test",
          embedding_model: "test",
        },
      });
    if (url.pathname === "/ai/mission/health")
      return route.fulfill({ json: { status: "ok", investigations_in_db: 4 } });
    if (url.pathname === "/ai/inference/test")
      return route.fulfill({
        json: {
          ok: false,
          checks: {
            ollama: { ok: false, message: "Local service is unavailable" },
          },
        },
      });
    if (url.pathname === "/ai/data/experiments")
      return route.fulfill({
        json: {
          total: 0,
          limit: Number(url.searchParams.get("limit")),
          offset: 0,
          experiments: [],
        },
      });
    if (url.pathname === "/ai/data/documents")
      return route.fulfill({ json: [] });
    if (url.pathname === "/ai/data/variables")
      return route.fulfill({ json: { variables: [] } });
    return route.fulfill({
      status: 503,
      json: { detail: "Not needed for test" },
    });
  });
});

test("appearance settings apply immediately, persist, and reset without clearing selection", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("ignis_selected_experiment_codes"))
      localStorage.setItem("ignis_selected_experiment_codes", '["ZARM-144"]');
  });
  await page.goto("/settings");
  await page.getByLabel("Color theme", { exact: true }).selectOption("light");
  await page.getByLabel("Sidebar", { exact: true }).selectOption("true");
  await page.getByLabel("Motion", { exact: true }).selectOption("reduced");
  await expect(page.locator(".shell")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".shell")).toHaveClass(/compact/);
  await expect(page.locator(".shell")).toHaveAttribute(
    "data-motion",
    "reduced",
  );
  await page.reload();
  await expect(page.getByLabel("Color theme", { exact: true })).toHaveValue(
    "light",
  );
  await expect(page.locator(".shell")).toHaveClass(/compact/);
  await page.getByRole("button", { name: "Restore defaults" }).click();
  await expect(page.locator(".shell")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".shell")).not.toHaveClass(/compact/);
  await expect(
    page.getByText("1 experiments in your shared shortlist."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear selection" }).click();
  await expect(
    page.getByText("0 experiments in your shared shortlist."),
  ).toBeVisible();
});

test("research defaults control explorer requests and the next assistant view", async ({
  page,
}) => {
  await page.goto("/settings");
  await page.getByLabel("Default collection").selectOption("all");
  await page.getByLabel("Experiments per page").selectOption("24");
  await page.getByLabel("Default assistant mode").selectOption("Paper");
  const request = page.waitForRequest((request) =>
    request.url().includes("/ai/data/experiments?"),
  );
  await page
    .locator("aside")
    .getByRole("link", { name: "Experiments", exact: true })
    .click();
  const url = new URL((await request).url());
  expect(url.searchParams.get("limit")).toBe("24");
  expect(url.searchParams.get("curated")).toBe("false");
  await page
    .locator("aside")
    .getByRole("link", { name: "AI research assistant", exact: true })
    .click();
  await expect(page.getByRole("button", { name: /^Paper/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("provider failures and connection configuration have actionable feedback", async ({
  page,
}) => {
  await page.goto("/settings");
  await page.getByLabel("Inference provider").selectOption("ollama");
  await page.getByRole("button", { name: "Test inference connection" }).click();
  await expect(page.getByText("Some services need attention")).toBeVisible();
  await expect(page.getByText(/Local service is unavailable/)).toBeVisible();
  await page
    .getByLabel("API address")
    .fill("https://user:password@example.com");
  await page.getByRole("button", { name: "Apply connection" }).click();
  await expect(page.getByRole("alert")).toContainText("without credentials");
  await page.getByLabel("Inference provider").selectOption("nim-mixed");
  const directRequest = page.waitForRequest(
    (request) => request.url() === "http://127.0.0.1:8001/ai/health",
  );
  await page.getByLabel("API address").fill("http://127.0.0.1:8001");
  await page.getByRole("button", { name: "Apply connection" }).click();
  expect((await directRequest).headers()["x-ignis-chat-backend"]).toBe("nim");
  expect(
    await page.evaluate(() => localStorage.getItem("ignis_infer_mode")),
  ).toBe("nim-mixed");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("ignis_api_base")))
    .toBe("http://127.0.0.1:8001");
  await page.getByRole("button", { name: "Use default connection" }).click();
  await expect(page.getByLabel("API address")).toHaveValue("");
});

test("settings are usable on mobile and in light mode", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/settings");
  await page.getByLabel("Motion", { exact: true }).selectOption("reduced");
  await page.screenshot({
    path: "../artifacts/ux-review/settings-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("Color theme", { exact: true }).selectOption("light");
  await page.screenshot({
    path: "../artifacts/ux-review/settings-light.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByLabel("Color theme", { exact: true }).selectOption("dark");
  await page.screenshot({
    path: "../artifacts/ux-review/settings-desktop.png",
    fullPage: true,
  });
});
