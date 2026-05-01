# Prioritization Workspace

A decision-making workspace where SBU teams submit tech-debt and improvement requests, AI scores them, and reviewers triage a capped, ranked queue that hands off to delivery.

## What this is

Two ideas, one dataset:

- A **submission** flow that turns rough asks into well-scored requests with effort estimates.
- A **triage** flow that ranks those requests against a fixed capacity budget and a chronological set of timelines, so the work that gets approved is also the work that can actually fit.

## The two experiences

Switch between them in the top-bar variant switcher — same data, different presentation:

- **Signal** — a live ops console with a kanban-style triage board. Best when you think in columns and stages.
- **Council** — a decision room with a single ranked queue, capacity bars, and an "approve / defer" rhythm. Best when you think in priorities.

## The three roles

Use the role switcher in the header to change perspective at any time:

| Role | Where it lives | What it does |
|---|---|---|
| **Intake** (requestor) | Submission form | Submit a request. The Oracle/coach evaluates the justification as you type and suggests an effort estimate. |
| **Triage** (reviewer) | The queue | Work the ranked list. Edit, defer, or approve & hand off. Capacity-by-timeline is always visible. |
| **Review** (stakeholder) | Visibility view | Read-only window into decisions, capacity, and what's been handed off. |

## Day-to-day flow

1. **Submit** a request (manually or via import). It lands as `submitted`.
2. **Auto-score** runs in the background and assigns a 0–100 total + confidence (high / medium / low) + per-pillar breakdown (impact, cost avoidance, scale, strategic alignment, feasibility).
3. **Triage** the queue. Items ranked by AI score (or your manual rank, or by timeline). Filter by SBU, confidence, and timeline. Edit a request inline to re-trigger scoring. Approve to hand off (a fake `SXG-######` ID is generated), or defer.
4. **Hand-off** items leave the queue and consume committed capacity.
5. **Report** out: the Report button generates a PDF or PPTX of the current state.

## Key concepts

- **Target timelines** are chronological: `FY27 Semester 1 — Sprint 1 → Sprint 2 → Sprint 3 → FY27 Semester 2 → Backlog`. Anywhere items are sorted by timeline, they follow this order.
- **Capacity cut line.** There's a 200-day budget. As you walk the score-sorted queue, days accumulate; the line is drawn at the last item that still fits. Items below the line are visibly marked.
- **Approved-but-future demotion.** If an item is approved for a timeline later than Sprint 1, it slips just below the cut line — it's already decided, it doesn't need to compete this sprint.
- **Pending indicator.** Items that haven't been decided on yet (still `submitted` or `scored`) show a "pending" tag in the queue.
- **Capacity by timeline** widget shows queue load per timeline (Sprint 1–3 and Sem 2 each have a 50-day bar; Backlog is uncapped). Handed-off and deferred items are excluded — you're looking at what's still open.
- **Manual rank** lets a reviewer drag items into a preferred order, overriding AI score. Reset with the "AI rank" button.

## Reports

Click **Report** in the header to export a snapshot of the current state as PDF or PowerPoint. Useful for stakeholder reviews and chamber-style decision meetings.

## Tech, briefly

- React + Vite + TypeScript, TanStack Query, Tailwind, Framer Motion
- Lovable Cloud backend (Supabase) with edge functions for: scoring (`score-request`), justification coaching (`coach-justification`), ranking explanations (`explain-ranking`), import (`import-requests`), seed (`seed-backlog`), reset (`reset-scenario`), and report build (`build-report`)
- Edit and re-deploy through the Lovable project page; backend functions deploy automatically.
