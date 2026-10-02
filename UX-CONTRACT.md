# UX Contract

## Product context

- Audience: a single authenticated project owner in the MVP.
- Primary jobs: sign in, review a five-stage Kanban board, create/edit/move cards, rename columns, and ask the assistant to change the board.
- Target market(s): local English-language MVP.
- Active locales: `en`.
- Language/content register and native-review policy: concise English product copy; no regional or regulated claim.
- Timezone/calendar policy: no date inputs in the MVP.
- Accessibility target: WCAG 2.2 AA.

## Business-context sources

| Domain / scope | Authoritative source | Source type | Reviewed date |
|---|---|---|---|
| Permission model | `AGENTS.md` | Product brief | 2026-09-24 |
| Data lifecycle | `docs/PLAN.md` | Project plan | 2026-09-24 |
| Deletion / retention | Not in MVP | Not applicable | 2026-09-24 |
| Billing / payment | Not in MVP | Not applicable | 2026-09-24 |
| Legal / regulatory copy | Not in MVP | Not applicable | 2026-09-24 |
| Market / content conventions | `DESIGN.md` | Design context | 2026-09-24 |

## Visual contract

- Project `DESIGN.md`: `DESIGN.md`.
- Token ownership model: existing runtime canonical.
- Runtime design-system/token source: `frontend/src/app/globals.css`.
- Mapping/export/adapters: CSS custom properties mapped directly to shared frontend components.
- Token drift gate: frontend lint/build and premium static audit.
- Supported themes: light and operating-system forced colors.
- Design-context owner/review policy: project maintainers update `DESIGN.md` with durable token changes.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native select in `KanbanCard` | This contract | platform-owned destination menu accepted | keyboard/browser test |
| Form | Shared frontend form styles and inline validation | This contract | sign-in / new card / edit card / chat | unit + browser test |
| Scrollbar | `globals.css` | `DESIGN.md` | stable-gutter board region | computed style/browser test |
| Toast | Persistent local status regions | This contract | save / AI failure | unit + browser test |
| CRUD | `api.ts` plus `KanbanBoard` state queue | Board API contract | create / edit / move / rename stay in context | full-flow browser test |

## Component behavior

| Component | Default | Hover | Focus | Active | Disabled | Busy | Error |
|---|---|---|---|---|---|---|---|
| Button | labelled | border/tone shift | blue outline | darker tone | muted/no handler | fixed geometry + status | inline recovery |
| Input | labelled | border darkens | blue outline | n/a | muted | n/a | described error |
| Secret input | masked with reveal | as input | as input | n/a | muted | sign-in pending | generic form alert |
| Textarea | `resize: none` | border darkens | blue outline | n/a | muted | send pending | local alert + retry |
| Board | five columns | lifted cards | control rings | drag feedback | n/a | stable save status | retryable save status |

## Flow ledger

| Operation | Trigger | Pending | Success destination | Success feedback | Failure recovery | Focus outcome | Source ref |
|---|---|---|---|---|---|---|---|
| Sign in | Sign in | stable button | board | board loads | form alert, retain username | board heading | `AGENTS.md` |
| Sign out | Sign out | stable button | sign-in | sign-in form | local alert | username field | `AGENTS.md` |
| Create card | Add card | save status | same column | status line | retry last board state | new card title | `AGENTS.md` |
| Edit card | Save changes | stable button | same card | status line | dialog stays open | edited card | `AGENTS.md` |
| Move card | Drag or destination select | save status | same board | status line | retry last board state | moved card control | `AGENTS.md` |
| Rename column | Commit field on blur/Enter | save status | same board | status line | retry last board state | column field | `AGENTS.md` |
| Ask assistant | Send message | stable send button | same sidebar | assistant reply and refreshed board | alert with retry | chat textarea | `AGENTS.md` |

## Navigation and responsive behavior

- Route document title policy: `Kanban Studio` on the single route.
- Route error / 403 page behavior: API unauthorized responses return the sign-in view; no roles or resource-specific 403 routes exist in the MVP.
- Sidebar/drawer/bottom-sheet transformation: the assistant is a persistent non-modal aside on desktop and follows the board in document flow on narrow screens.
- Truncation/full-value access: titles and messages wrap; no hover-only full values.
- Focus restoration and sticky-obstruction policy: card edit modal restores focus to its trigger; no sticky action bars obscure focus.

## Overlays and feedback

- Dialog primitive: one app-owned modal with focus trap, Escape cancel, inert page background, and trigger focus restoration.
- Destructive confirmation levels: card deletion is not an MVP feature.
- Toast placement/duration/deduplication: not used; retryable save and chat failures remain visible locally.
- Alert/banner scope and persistence: local form/chat alert until the user corrects or retries.
- Layer/z-index contract: global CSS variables define dropdown 200, backdrop 500, dialog 600, toast 900.

## Async and resilience

- Mutation default: locally responsive, server-confirmed queued writes in user action order.
- Idempotency and duplicate-submit policy: buttons disable while their request is pending; board saves serialize.
- Offline/read-stale/write behavior: preserve current board and expose retry; do not queue across a reload.
- Retry/backoff/timeout behavior: a failed board/chat request shows an explicit retry path; no automatic retries.
- Version conflict and multi-tab behavior: out of scope for one-user local MVP; server validation prevents malformed overwrite.
- Session expiry/re-authentication: unauthenticated API result returns to sign-in without preserving credentials.
- Stale-request cancellation/invalidation and pending-state ownership: save queue keeps board writes ordered; chat waits for pending saves before sending.
- Dialog/form preservation and retry after mutation failure: edit stays open on save failure; new-card data remains until success.

## Validation

- Schema/validation layer: client checks required fields; FastAPI Pydantic models validate every API payload and saved board.
- Trigger timing: submit for sign-in/new/edit/chat; blur or Enter for column names.
- Error summary/inline policy: form-level alerts plus field-level required guidance.
- Sensitive-value handling: password is masked, never persisted or echoed.
- `noValidate`, first-invalid focus, duplicate-submit prevention, unsaved changes, and submit recovery: all product forms use `noValidate`; invalid submission focuses the first invalid field; pending buttons prevent duplicate submit.

## Verification

- Required static commands: frontend lint/unit/build/browser tests; backend pytest; premium static audit.
- Browser/device/locale/theme matrix: Chromium desktop and narrow width, English light theme, reduced motion.
- Accessibility checks: keyboard login/form/drag alternative/dialog/Escape plus accessible names.
- Canonical sibling flow used for comparison: only one board route exists; shared form and button patterns are compared across sign-in, card, and chat forms.
