# Project Management MVP plan

## Decision record

- The current root `AGENTS.md` supersedes this document's older Docker wording. The MVP will run locally through FastAPI and static Next.js output, without Docker.
- The board is persisted as one validated JSON document per user in SQLite. This keeps the fixed-column MVP simple while retaining a `users` table for future accounts.
- The frontend is a static Next.js export. FastAPI owns `/api/*` and serves `frontend/out` at `/`.
- The user approved proceeding with this plan on 2026-09-24.

## Part 1: Plan and codebase orientation

- [x] Review the root and nested `AGENTS.md` instructions.
- [x] Record the Docker-plan conflict and the current local-run decision.
- [x] Describe the inherited frontend in `frontend/AGENTS.md`.
- [x] Create durable visual and UX contracts for the product UI.

Tests and success criteria:

- [x] The plan names the implementation order, ownership decisions, and verification for every MVP capability.
- [x] The frontend guidance identifies the existing drag-and-drop board and test commands.

## Part 2: Local scaffolding

- [x] Create a `uv`-managed FastAPI project in `backend/`.
- [x] Add health and sample API endpoints, then serve a static frontend directory at `/`.
- [x] Add start and stop scripts for PowerShell, macOS, and Linux.
- [x] Ignore generated frontend output, local SQLite data, server PID, and logs.

Tests and success criteria:

- [x] `uv run pytest` verifies the health endpoint and static-file server.
- [x] The start script builds the frontend and starts FastAPI at `http://127.0.0.1:8000`.

## Part 3: Static frontend integration

- [x] Configure Next.js for static export.
- [x] Keep the existing five-column Kanban demo as the initial board.
- [x] Preserve drag-and-drop and provide a non-drag move control.
- [x] Replace external build-time font loading with local system stacks.

Tests and success criteria:

- [x] `npm run build` produces `frontend/out`.
- [x] Unit and browser tests cover five columns, create, rename, edit, and move interactions.

## Part 4: Sign-in experience

- [x] Add FastAPI login, logout, current-user, and session-cookie endpoints.
- [x] Accept only the MVP credentials `user` / `password`.
- [x] Gate the board behind sign-in and show signed-in identity plus logout.
- [x] Provide app-owned invalid-credential and network-error states.

Tests and success criteria:

- [x] Backend tests prove protected routes reject unauthenticated requests and valid login creates a session.
- [x] Browser tests prove invalid login remains recoverable, valid login reaches the board, and logout returns to sign-in.

## Part 5: Database modelling

- [x] Document the SQLite JSON-board schema and lifecycle in `docs/DATABASE.md`.
- [x] Create users and boards tables on first backend startup.
- [x] Seed a default board for a user who does not have one.

Tests and success criteria:

- [x] Tests use a temporary database and prove board creation, read, update, and isolation by user ID.
- [x] The document explains keys, JSON validation, and the migration path to normalized tables if needed.

## Part 6: Board API

- [x] Add authenticated read and replace-board endpoints.
- [x] Validate exactly five columns, unique card ownership, and referenced card IDs.
- [x] Return useful status codes without exposing internal errors.

Tests and success criteria:

- [x] Tests cover unauthenticated access, valid persistence, malformed board rejection, and automatic database creation.

## Part 7: Persistent board UI

- [x] Load the board after sign-in and display a stable loading/error state.
- [x] Persist card creation, edits, column renames, drag moves, and non-drag moves.
- [x] Serialize saves so an older response cannot overwrite a later board action.
- [x] Keep failure recovery visible and retryable.

Tests and success criteria:

- [x] Frontend unit tests cover API states and update payloads.
- [x] Browser tests cover a persisted board change across a page reload against FastAPI.

## Part 8: OpenRouter connectivity

- [x] Add an OpenRouter client that reads `OPENROUTER_API_KEY` only from the server environment.
- [x] Use `nvidia/nemotron-3-ultra-550b-a55b` for requests.
- [x] Add a manual `2 + 2` connectivity check that does not print the API key.

Tests and success criteria:

- [x] Unit tests mock the provider and cover provider failures.
- [x] With a configured key, the manual check returns an answer containing `4`.

## Part 9: Structured board assistant API

- [x] Send the canonical board JSON, recent conversation, and user request to OpenRouter.
- [x] Require JSON containing an assistant reply and either a full updated board or `null`.
- [x] Validate and persist a returned board before responding.
- [x] Reject malformed model output without corrupting the saved board.

Tests and success criteria:

- [x] Mocked tests cover reply-only, create/edit/move board updates, and invalid model payload recovery.
- [x] The API response contains the reply and the server-confirmed board when changed.

## Part 10: AI sidebar

- [x] Add a responsive persistent AI sidebar to the authenticated board.
- [x] Send conversation history, support Enter to send and Shift+Enter for a newline, and show busy/error/retry states.
- [x] Refresh the board automatically after a server-confirmed assistant update.
- [x] Keep chat messages transient in the client for the MVP.

Tests and success criteria:

- [x] Unit tests cover sending, provider failure, and a board-refresh response.
- [x] Browser tests cover sign-in, a board operation, a non-drag move, and AI-driven refresh through mocked API responses.

## Final verification

- [x] Run frontend lint, unit tests, production build, and browser tests.
- [x] Run backend tests and the manual OpenRouter connectivity check when credentials are available.
- [x] Run the project UI static audit and inspect the app at desktop and narrow widths.
- [x] Update this checklist with actual results before handoff.

## Verification record

- 2026-09-24: `npm.cmd run lint`, `npm.cmd run test:unit` (8 tests), `npm.cmd run build`, and `npm.cmd run test:e2e` (4 browser tests) passed.
- 2026-09-24: `npm.cmd run test:integration` passed against the assembled static frontend and FastAPI server.
- 2026-09-24: `uv run pytest` passed (9 tests). Starlette emitted one dependency deprecation warning for its current `TestClient` import.
- 2026-09-24: the live OpenRouter connectivity check returned `4` without exposing the configured key.
- 2026-09-24: the strict UI static audit reported zero findings; desktop and 390px browser coverage passed. The PowerShell start/stop scripts served `/api/health` and then released port 8000.
