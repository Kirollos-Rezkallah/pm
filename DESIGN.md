---
version: alpha
name: "Project Management MVP"
description: "A calm project-control room that keeps a five-stage board and AI assistant legible at a glance."
colors:
  accent-yellow: "#ecad0a"
  primary-blue: "#209dd7"
  secondary-purple: "#753991"
  navy-dark: "#032147"
  gray-text: "#888888"
  surface: "#f7f8fb"
  surface-strong: "#ffffff"
  border: "#dbe5ef"
  danger: "#b42318"
  focus: "#209dd7"
typography:
  display:
    fontFamily: "Aptos Display, Arial Narrow, Segoe UI, sans-serif"
  sans:
    fontFamily: "Aptos, Segoe UI, system-ui, sans-serif"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
rounded:
  DEFAULT: "0.75rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
spacing:
  page-inline: "1.5rem"
  section-gap: "1.5rem"
  control-height: "2.75rem"
components:
  button: {}
  card: {}
  input: {}
  dialog: {}
  sidebar: {}
---

# Project Management MVP Design System

## Overview

### Creative North Star

The product should feel like a well-marked project wall in a design studio: white work surfaces, navy annotation, thin blue rules, and yellow status marks. Its signature is the horizontal stage rail above the board, which turns the fixed workflow into an immediate visual map.

### Product context and register

- **Audience and primary job:** a signed-in project owner who needs to scan, arrange, and clarify a single project board quickly.
- **Target market(s) and evidence:** English-language local MVP; no regional-market claim is made.
- **Locale(s) and language policy:** English only (`en`); all visible and accessible interface copy is English.
- **Usage scene:** desktop-first project planning with a narrow-screen stacked fallback; medium-density cards and frequent short edits.
- **Register:** product.
- **Memorable signature:** the stage rail and concise uppercase labels use the board's real five-stage structure rather than decoration.
- **Restraint:** cards, forms, and chat messages remain plain and task-led; visual emphasis is reserved for status markers, active states, and the primary action.
- **Anti-references:** avoid a generic analytics dashboard, a playful sticky-note wall, and gradients that obscure card density.
- **Token ownership/runtime mapping:** `frontend/src/app/globals.css` is canonical runtime ownership (Tailwind v4 CSS variables). This document mirrors exact values and explains their roles; the frontend test and build commands plus the static audit guard drift.

## Colors

`navy-dark` is the primary reading color. `primary-blue` identifies links, focus, and informational controls; `secondary-purple` is the main committed-action color; `accent-yellow` marks flow and current attention without being the only status cue. `surface` and `surface-strong` make a quiet two-layer workspace, divided by `border`. Error states use `danger` with text and an icon/label. The MVP has one light theme; forced-colors mode defers to the operating system.

## Typography

Display headings use `display`; all UI text uses `sans`. The compact utility labels are uppercase only for short, non-sentence labels. Card titles and messages use normal sentence case. `mono` is reserved for diagnostic IDs, never for ordinary work. System font stacks avoid a build-time network dependency.

## Layout

The authenticated page has a board-first desktop grid with the assistant as a persistent right-side utility surface. The board columns scroll horizontally as one obvious region on compact screens; the chat panel follows the board below it. Inline page padding uses `page-inline`; section spacing uses `section-gap`. Loading, error, and saving feedback reserve their own line so controls do not move.

## Elevation & Depth

Static regions are separated primarily with quiet borders and tonal surfaces. Cards receive a small shadow only while lifted or hovered; dialogs use a single dim backdrop and stronger shadow. There are no decorative floating surfaces.

## Shapes

Controls use `md`; cards and panels use `lg`; the page header uses `xl`. Yellow stage markers are deliberately rounded pills. Borders are thin and navy-tinted rather than gray-black.

## Components

### Foundational visual states

Buttons and inputs have clear hover, focus-visible, pressed, disabled, and busy treatments. Focus uses `focus`; busy buttons reserve their label width. Initial board loading uses a stable text-and-spinner region, not an animated skeleton. All motion is limited to short opacity and border/color transitions, and is disabled under reduced motion.

### Buttons and actions

Purple solid buttons are the single primary action in a local decision area. Blue outline or text buttons are secondary. Destructive actions are red and spatially separated. Every action uses a specific verb.

### Navigation and data display

The stage rail is descriptive, not navigation. Board columns retain full labels, and cards wrap titles/details rather than hiding important content. The chat sidebar uses the same surface and border grammar as a column.

### Forms and overlays

Fields have visible labels, inline error text, blue focus rings, and no browser validation popups. Textareas do not resize manually. Card editing uses one app-owned modal dialog; toast-like transient feedback is replaced by visible, local status where a retry may be needed.

### Iconography

Use familiar text labels for MVP actions. If an icon-only control is introduced, it must have an accessible name and visible focus state.

### Motion

Use 150–200 ms ease-out feedback only for hover, board drag, and panel changes. Reduced motion removes transforms and animation delays.

### Content and data visualization

Use concise, direct project language: “Save changes”, “Card moved”, “Ask the assistant”. The assistant may describe an update, but the visible board remains the source of truth.

## Do's and Don'ts

- **Do:** use the stage rail and five columns to orient the user immediately.
- **Do:** use semantic runtime variables from `globals.css`, not copied raw hex values in components.
- **Don't:** turn routine board work into a dashboard full of charts, metrics, or settings.
- **Don't:** rely on color, drag interaction, hover, or motion as the only way to understand or operate the board.
