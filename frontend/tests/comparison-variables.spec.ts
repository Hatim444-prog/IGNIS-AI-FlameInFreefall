import { expect, test } from "@playwright/test";

test("comparison variables follow the complete experiment selection", async ({
  page,
}) => {
  const requested: string[][] = [];
  const experiment = (code: string) => ({
    experiment_code: code,
    investigation_code: "STUDY",
    investigation_title: "Test study",
    fuel_material: null,
    gravity_condition: null,
    oxygen_percent: null,
    pressure_pa: null,
    airflow_m_s: null,
    experiment_date: null,
  });
  await page.route("**/ai/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/ai/data/experiments") {
      return route.fulfill({
        json: {
          total: 3,
          limit: 100,
          offset: 0,
          experiments: ["A", "B", "C"].map(experiment),
        },
      });
    }
    if (url.pathname === "/ai/data/variables") {
      const codes = url.searchParams.getAll("experiment_codes");
      requested.push(codes);
      const names =
        codes.join(",") === "A,B"
          ? ["spread", "temperature"]
          : codes.join(",") === "B,C"
            ? ["pressure"]
            : [];
      return route.fulfill({
        json: {
          variables: names.map((variable_name) => ({
            variable_name,
            unit: "unit",
            experiment_count: 2,
            observation_count: 2,
          })),
        },
      });
    }
    if (url.pathname === "/ai/data/compare") {
      expect(route.request().postDataJSON()).toMatchObject({
        experiment_codes: ["A", "B"],
        variable_name: "temperature",
      });
      return route.fulfill({ json: { measurements: [] } });
    }
    return route.fulfill({
      status: 503,
      json: { detail: "Not needed for this test" },
    });
  });
  await page.goto("/analytics");
  const variable = page.getByLabel("Measured variable", { exact: false });
  const compare = page.getByRole("button", {
    name: "Compare measurements",
    exact: true,
  });
  await expect(variable).toBeDisabled();
  await page.getByLabel("A", { exact: true }).check();
  await expect(compare).toBeDisabled();
  expect(requested).toEqual([]);
  await page.getByLabel("B", { exact: true }).check();
  await expect(variable.locator("option")).toHaveText([
    "spread",
    "temperature",
  ]);
  await variable.selectOption("temperature");
  await compare.click();
  await expect(
    page.getByText("No matching measurements were returned."),
  ).toBeVisible();
  await page.getByLabel("C", { exact: true }).check();
  await expect(variable).toBeDisabled();
  await expect(
    page.getByText(
      /These experiments have no numeric measured variables in common/,
    ),
  ).toBeVisible();
  await expect(compare).toBeDisabled();
  await expect(
    page.getByText("No matching measurements were returned."),
  ).toHaveCount(0);
  await page.getByLabel("A", { exact: true }).uncheck();
  await expect(variable.locator("option")).toHaveText(["pressure"]);
  await expect(variable).toHaveValue("pressure");
  await expect(compare).toBeEnabled();
  expect(requested).toContainEqual(["A", "B", "C"]);
  expect(requested).toContainEqual(["B", "C"]);
});

test("failed shared-variable lookup explains recovery and disables comparison", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("ignis_selected_experiment_codes", '["A","B"]'),
  );
  let fail = true;
  await page.route("**/ai/**", (route) => {
    if (new URL(route.request().url()).pathname === "/ai/data/variables") {
      return route.fulfill(
        fail
          ? { status: 503, json: { detail: "Unavailable" } }
          : {
              json: {
                variables: [
                  {
                    variable_name: "spread",
                    unit: "mm/s",
                    experiment_count: 2,
                    observation_count: 2,
                  },
                ],
              },
            },
      );
    }
    return route.fulfill({ status: 503, json: { detail: "Not needed" } });
  });
  await page.goto("/analytics");
  await expect(page.getByRole("alert")).toContainText(
    "Could not load shared measured variables",
  );
  await expect(
    page.getByRole("button", { name: "Compare measurements", exact: true }),
  ).toBeDisabled();
  fail = false;
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByLabel("Measured variable")).toHaveValue("spread");
  await expect(
    page.getByRole("button", { name: "Compare measurements", exact: true }),
  ).toBeEnabled();
});
