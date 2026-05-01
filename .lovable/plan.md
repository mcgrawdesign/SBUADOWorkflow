## Global

**Show effort (estimated_days) on every item render**
- Council Triage queue rows (`QueueItem`) — small `{n}d` chip next to score.
- Council Triage hero card — add to the metadata row.
- Council Visibility list rows (top items + deferred).
- Signal Review board cards — append `· {n}d` to the SBU/score row.
- Signal Review detail panel — already shows score; add an "effort" stat.
- Signal Visibility list/table — add an effort column/badge.
- When `estimated_days` is null, render a dim `—` so layout stays consistent.

**Capacity metric updates on hand-off**
- Signal Review backlog-health capacity already sums `in_review + approved + handed_off` days. Keep the formula but make hand-off the visible event:
  - When the user advances an item to `handed_off`, briefly pulse/animate the capacity bar so the change is obvious.
- Council Triage: replace the count-based capacity (`idx/12`) with a days-based metric mirroring Signal:
  - `capacityUsed = sum(estimated_days)` over items currently `in_review`, `approved`, or `handed_off`.
  - Display as `{used}d / {CAPACITY_DAYS_BUDGET}d` with the same gold/destructive thresholding (>80% warns).
  - Same pulse animation on hand-off.

## Signal — defer from triage

**Detail-panel Defer button** in `SignalVariant.tsx` `SignalReview` right panel:
- Add a `Defer` button next to the existing advance / Send-to-ADO buttons.
- Hidden when `selected.status` is already `deferred`, `handed_off`, or `approved`.
- On click: `update.mutate({ id, status: "deferred" })`, toast `"Deferred: <title>"`, clear selection.
- No card-level inline defer button.

## Council — filtered ranks + days-based cut line

In `CouncilReview` (`CouncilVariant.tsx`):

**1. Track overall vs filtered position**
- `baseRanked` is already the unfiltered ranked list. Build a `Map<id, overallIndex>` from it.
- `ranked` (filtered) renders as today, but each `QueueItem` gets both its filtered index `i` and its overall index `overallIdx`.
- Header changes:
  - Queue label: `Queue · {ranked.length} of {baseRanked.length}` when a filter is active.
  - Hero header: `Item {filteredIdx + 1} of {ranked.length} · #{overallIdx + 1} overall`.

**2. Per-row position display**
- In `QueueItem`, show `{filteredIdx + 1} / {overallIdx + 1}` (small, monospaced, dim) when filters are active.
- When no filter, show only the position number as today.

**3. Days-based cut line, anchored to overall ranking**

Compute the cut once on `baseRanked`:
- `committedDays = sum(estimated_days)` for items already `handed_off`.
- Walk `baseRanked` accumulating `estimated_days` (treat null as 0).
- The cut line falls **after** the last item where `committedDays + cumulative <= CAPACITY_DAYS_BUDGET`. Store that as `cutOverallIdx` (the overall index of the last "above the line" item).

Render in the filtered queue:
- For each pair of adjacent filtered rows (a, b), if `overallIdx(a) <= cutOverallIdx < overallIdx(b)`, draw the cut-line divider between them.
- If the cut falls outside the visible filtered range (all filtered items above it, or all below), render a single ghost marker row labelled `— cut line at overall #{cutOverallIdx + 1} —` at the appropriate end.
- Hero "Within capacity / Below the cut line" badge uses `overallIdx <= cutOverallIdx` instead of the old `idx < CAPACITY_CUT_LINE` check.

**4. Capacity strip uses the new metric**
- Replace `Math.min(idx + 1, CAPACITY_CUT_LINE)` UI with the days-based `capacityUsed / CAPACITY_DAYS_BUDGET` display (matches Signal).
- Keep gold styling; switch to destructive when over budget.

## Atlas — hide from switcher, keep files

- `VariantSwitcher.tsx`: drop the Atlas option from the rendered list. Leave the type and route handling intact so saved state with `atlas` still works (or silently coerces to `signal`).
- `src/pages/Index.tsx`: leave the `<AtlasVariant />` branch in place (or guard with a `SHOW_ATLAS = false` const) so files stay live and importable but unreachable through the UI.
- No file deletions, no domain/type changes.

## Technical Details

**Files to edit**
- `src/variants/council/CouncilVariant.tsx`
  - `QueueItem`: add effort chip + dual-rank display, accept `overallIdx` prop, swap cut-line trigger to overall index.
  - `CouncilReview`: build `overallIdxById`, compute `cutOverallIdx` (days-based incl. handed_off), compute `capacityUsed` days, restyle capacity strip, update hero header + status badge.
  - `CouncilVisibility` list rows: append effort badge.
- `src/variants/signal/SignalVariant.tsx`
  - Cards in the board grid: append `{n}d` next to score.
  - Detail panel: add `Defer` action button + effort stat.
  - Capacity strip: add a brief animation key tied to handed-off count change.
- `src/components/VariantSwitcher.tsx` — remove Atlas tab (keep type).
- `src/lib/domain.ts` — no schema changes; `CAPACITY_DAYS_BUDGET` already exists.

**No DB migration, no edge-function changes.** Pure UI/derived state.

**Out of scope**
- Any redesign of intake forms.
- Real ADO integration.
- Removing Atlas code/types from the codebase.
- Per-card defer button on Signal (detail panel only, per your choice).
