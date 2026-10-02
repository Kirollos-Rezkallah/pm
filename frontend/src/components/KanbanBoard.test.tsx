import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KanbanBoard } from "@/components/KanbanBoard";
import type { BoardData } from "@/lib/kanban";

const board: BoardData = {
  columns: [
    { id: "col-backlog", title: "Backlog", cardIds: ["card-1"] },
    { id: "col-discovery", title: "Discovery", cardIds: [] },
    { id: "col-progress", title: "In Progress", cardIds: [] },
    { id: "col-review", title: "Review", cardIds: [] },
    { id: "col-done", title: "Done", cardIds: [] },
  ],
  cards: {
    "card-1": { id: "card-1", title: "Plan release", details: "Confirm the launch checklist." },
  },
};

const cloneBoard = () => structuredClone(board);
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const mockWorkspaceFetch = (nextBoard = cloneBoard()) => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(response({ username: "user" }))
    .mockResolvedValueOnce(response(nextBoard));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("KanbanBoard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the five-column board", async () => {
    mockWorkspaceFetch();
    render(<KanbanBoard />);

    expect(await screen.findByRole("heading", { name: "Kanban Studio" })).toBeVisible();
    expect(screen.getAllByTestId(/column-/i)).toHaveLength(5);
  });

  it("renames a column and saves the updated board", async () => {
    const fetchMock = mockWorkspaceFetch();
    fetchMock.mockResolvedValueOnce(response({}));
    const user = userEvent.setup();
    render(<KanbanBoard />);

    const column = await screen.findByTestId("column-col-backlog");
    const input = within(column).getByLabelText("Column name");
    await user.clear(input);
    await user.type(input, "Ideas");
    await user.tab();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const requestInit = fetchMock.mock.calls[2][1] as RequestInit;
    expect(JSON.parse(String(requestInit.body)).columns[0].title).toBe("Ideas");
  });

  it("adds, edits, and moves cards without requiring drag and drop", async () => {
    const fetchMock = mockWorkspaceFetch();
    fetchMock.mockResolvedValue(response({}));
    const user = userEvent.setup();
    render(<KanbanBoard />);

    const backlog = await screen.findByTestId("column-col-backlog");
    await user.click(within(backlog).getByRole("button", { name: "Add a card" }));
    await user.type(within(backlog).getByLabelText("Card title"), "New task");
    await user.type(within(backlog).getByLabelText("Details"), "A short note.");
    await user.click(within(backlog).getByRole("button", { name: "Add card" }));
    expect(await within(backlog).findByText("New task")).toBeVisible();

    await user.click(within(backlog).getByRole("button", { name: /Edit New task/ }));
    const dialog = await screen.findByRole("dialog", { name: "Edit card" });
    const dialogTitle = within(dialog).getByLabelText("Title");
    await user.clear(dialogTitle);
    await user.type(dialogTitle, "Updated task");
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(await within(backlog).findByText("Updated task")).toBeVisible();

    await user.selectOptions(screen.getByLabelText("Move Updated task to another column"), "col-review");
    expect(await within(screen.getByTestId("column-col-review")).findByText("Updated task")).toBeVisible();
  });

  it("refreshes the board from a structured assistant response", async () => {
    const assistantBoard = cloneBoard();
    assistantBoard.columns[1].title = "Research";
    const fetchMock = mockWorkspaceFetch();
    fetchMock.mockResolvedValueOnce(response({ reply: "I renamed the column.", board: assistantBoard }));
    const user = userEvent.setup();
    render(<KanbanBoard />);

    const request = await screen.findByLabelText("Your request");
    await user.type(request, "Rename Discovery to Research");
    await user.click(screen.getByRole("button", { name: "Send request" }));

    expect(await screen.findByText("I renamed the column.")).toBeVisible();
    expect(screen.getByDisplayValue("Research")).toBeVisible();
  });

  it("shows an in-app error for invalid sign-in", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ detail: "Sign in is required." }, 401))
      .mockResolvedValueOnce(response({ detail: "Invalid username or password." }, 401));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<KanbanBoard />);

    await screen.findByRole("heading", { name: "Kanban Studio" });
    await user.type(screen.getByLabelText("Username"), "user");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid username or password.");
  });
});
