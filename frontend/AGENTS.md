# Frontend guidance

## Purpose

This directory is a Next.js 16 static-export frontend for the Project Management MVP. FastAPI serves `out/` in the local production setup; the Next.js dev server is only for frontend development.

## Existing structure

- `src/app/` contains the root route, layout metadata, and global design tokens.
- `src/components/` contains the client-side Kanban board, columns, cards, and card form.
- `src/lib/kanban.ts` defines the board data shape, starter board, IDs, and card-move helper.
- `src/**/*.test.tsx` contains Vitest component/unit tests.
- `tests/` contains Playwright browser tests.

## Commands

- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npm run test:e2e`

## Conventions

- Keep API calls in `src/lib/api.ts`; components receive data and callbacks rather than duplicating network behavior.
- Use native buttons and labelled inputs. All forms use `noValidate`; textareas use `resize-none`.
- Preserve the API `BoardData` shape. Card movement must retain drag-and-drop and a non-drag alternative.
- The app is English-only for this MVP. Do not persist credentials, API keys, or chat history in browser storage.
