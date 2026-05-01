import { motion } from "framer-motion";
import { CAPACITY_DAYS_BUDGET, TIMELINES, type RequestWithScore, type Timeline } from "@/lib/domain";

const SEGMENT_STATUSES = ["in_review", "approved", "handed_off"] as const;
type SegStatus = (typeof SEGMENT_STATUSES)[number];

const SEG_LABEL: Record<SegStatus, string> = {
  in_review: "In review",
  approved: "Approved",
  handed_off: "Handed off",
};

const SEG_COLOR: Record<SegStatus, string> = {
  in_review: "hsl(var(--council-text-dim))",
  approved: "hsl(var(--council-gold) / 0.55)",
  handed_off: "hsl(var(--council-gold))",
};

const PER_TIMELINE_BUDGET = Math.round(CAPACITY_DAYS_BUDGET / TIMELINES.length);

export function CouncilCapacity({
  data,
  pulseKey,
}: {
  data: RequestWithScore[] | undefined;
  pulseKey?: string | number;
}) {
  // Build per-timeline + per-status totals
  const totals: Record<Timeline, Record<SegStatus, number>> = TIMELINES.reduce((acc, t) => {
    acc[t] = { in_review: 0, approved: 0, handed_off: 0 };
    return acc;
  }, {} as Record<Timeline, Record<SegStatus, number>>);

  (data ?? []).forEach((r) => {
    if (!SEGMENT_STATUSES.includes(r.status as SegStatus)) return;
    const t = r.target_timeline as Timeline;
    if (!totals[t]) return;
    totals[t][r.status as SegStatus] += r.estimated_days ?? 0;
  });

  return (
    <motion.div
      key={`council-cap-${pulseKey ?? "x"}`}
      initial={{ boxShadow: "0 0 0 0 hsl(var(--council-gold) / 0.45)" }}
      animate={{ boxShadow: ["0 0 0 0 hsl(var(--council-gold) / 0.45)", "0 0 0 8px hsl(var(--council-gold) / 0)"] }}
      transition={{ duration: 0.8 }}
      className="mb-4 rounded-sm border border-[hsl(var(--council-line))] bg-[hsl(var(--council-surface))] p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.25em] text-[hsl(var(--council-text-dim))]">
          Capacity by timeline
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-[hsl(var(--council-text-dim))]">
          {SEGMENT_STATUSES.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: SEG_COLOR[s] }} />
              {SEG_LABEL[s]}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {TIMELINES.map((t) => {
          const row = totals[t];
          const used = row.in_review + row.approved + row.handed_off;
          const over = used > PER_TIMELINE_BUDGET;
          // Scale denominator: when over budget, normalize segments to fill (and visually overflow) the bar proportionally
          const denom = Math.max(PER_TIMELINE_BUDGET, used) || 1;
          const pct = (n: number) => (n / denom) * 100;
          return (
            <div key={t} className="grid grid-cols-[140px_1fr_72px] items-center gap-3">
              <div className="text-[11px] text-[hsl(var(--council-text-dim))] truncate" title={t}>{t}</div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--council-line))]" role="progressbar" aria-valuenow={Math.min(used, PER_TIMELINE_BUDGET)} aria-valuemin={0} aria-valuemax={PER_TIMELINE_BUDGET} aria-label={`${t} capacity`}>
                {/* stacked segments */}
                <div className="absolute inset-y-0 left-0 flex">
                  {SEGMENT_STATUSES.map((s) => (
                    <div
                      key={s}
                      className="h-full"
                      style={{ width: `${pct(row[s])}%`, background: SEG_COLOR[s] }}
                      title={`${SEG_LABEL[s]}: ${row[s]}d`}
                    />
                  ))}
                </div>
              </div>
              <div className={`text-right text-[11px] tabular-nums ${over ? "text-[hsl(var(--destructive))]" : "text-[hsl(var(--council-text-dim))]"}`}>
                {used}d <span className="text-[hsl(var(--council-text-dim))]/60">/ {PER_TIMELINE_BUDGET}d</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
