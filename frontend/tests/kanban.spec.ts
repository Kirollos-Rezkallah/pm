import { expect, test, type Page } from "@playwright/test";

type Board = {
  columns: { id: string; title: string; cardIds: string[] }[];
  cards: Record<string, { id: string; title: string; details: string }>;
};

const initialBoard = (): Board => ({
  columns: [
    { id: "col-backlog", title: "Backlog", cardIds: ["card-1"] },
    { id: "col-discovery", title: "Discovery", cardIds: [] },
    { id: "col-progress", title: "In Progress", cardIds: [] },
    { id: "col-review", title: "Review", cardIds: [] },
    { id: "col-done", title: "Done", cardIds: [] },
  ],
  cards: { "card-1": { id: "card-1", title: "Plan release", details: "Confirm the launch checklist." } },
});

const apiHeaders = { "access-control-allow-origin": "http://127.0.0.1:3000", "access-control-allow-credentials": "true", "content-type": "application/json" };

const mockApi = async (page: Page) => {
  let signedIn = false;
  let board = initialBoard();
  await page.route("http://127.0.0.1:8000/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const respond = (status: number, body?: object) => route.fulfill({ status, headers: apiHeaders, body: body ? JSON.stringify(body) : undefined });

    if (url.pathname === "/api/auth/me") return signedIn ? respond(200, { username: "user" }) : respond(401, { detail: "Sign in is required." });
    if (url.pathname === "/api/auth/login") {
      const credentials = request.postDataJSON();
      if (credentials.username === "user" && credentials.password === "password") {
        signedIn = true;
        return respond(200, { username: "user" });
      }
      return respond(401, { detail: "Invalid username or password." });
    }
    if (url.pathname === "/api/auth/logout") {
      signedIn = false;
      return respond(204);
    }
    if (!signedIn) return respond(401, { detail: "Sign in is required." });
    if (url.pathname === "/api/board" && request.method() === "GET") return respond(200, board);
    if (url.pathname === "/api/board" && request.method() === "PUT") {
      board = request.postDataJSON();
      return respond(200, board);
    }
    if (url.pathname === "/api/chat") {
      board = structuredClone(board);
      board.columns[1].title = "Research";
      return respond(200, { reply: "I renamed Discovery to Research.", board });
    }
    return respond(404, { detail: "Not found" });
  });
};

test("signs in and persists board operations", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Kanban Studio" })).toBeVisible();
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByTestId("column-col-backlog")).toBeVisible();
  const backlog = page.getByTestId("column-col-backlog");
  await backlog.getByRole("button", { name: "Add a card" }).click();
  await backlog.getByLabel("Card title").fill("Playwright card");
  await backlog.getByLabel("Details").fill("Added in a browser test.");
  await backlog.getByRole("button", { name: "Add card" }).click();
  await expect(backlog.getByText("Playwright card")).toBeVisible();

  await page.getByLabel("Move Playwright card to another column").selectOption("col-review");
  await expect(page.getByTestId("column-col-review").getByText("Playwright card")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("column-col-review").getByText("Playwright card")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Kanban Studio" })).toBeVisible();
});

test("keeps an invalid sign-in recoverable", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password", { exact: true }).fill("incorrect");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.locator(".form-alert")).toHaveText("Invalid username or password.");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByTestId("column-col-backlog")).toBeVisible();
});

test("refreshes the visible board after an assistant request", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.getByLabel("Your request").fill("Rename Discovery to Research");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("I renamed Discovery to Research.")).toBeVisible();
  await expect(page.locator("#column-title-col-discovery")).toHaveValue("Research");
});

test("keeps the board and assistant usable at a narrow width", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByTestId("column-col-backlog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ask for a board change" })).toBeVisible();
});
