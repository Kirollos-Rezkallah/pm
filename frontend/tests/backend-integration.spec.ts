import { expect, test } from "@playwright/test";

test("persists a board edit through the assembled FastAPI server", async ({ page }) => {
  const updatedTitle = `Ideas ${Date.now()}`;
  await page.goto("/");
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();

  const backlog = page.getByTestId("column-col-backlog");
  await expect(backlog).toBeVisible();
  const title = backlog.getByLabel("Column name");
  await title.fill(updatedTitle);
  await title.press("Tab");
  await expect(page.getByText("Column name saved.")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("column-col-backlog").getByLabel("Column name")).toHaveValue(updatedTitle);
});
