import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, ChevronRight, Check, Clock, ArrowUpRight, BookOpen, FileText, ArrowUp, ArrowDown, X } from "lucide-react";
import { useAppState } from "@/lib/appState";
import { useAutoScore, useRequests, useUpdateStatus, explainRanking } from "@/lib/useRequests";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ResetButton } from "@/components/ResetButton";
import { ReportButton } from "@/components/ReportButton";
import { ImportDialog } from "@/components/ImportDialog";
import { CLASSIFICATIONS, SBUS, STATUSES, STATUS_LABEL, TIMELINES, WORK_ITEM_TYPES, type RequestWithScore, type SBU, type Status, type Timeline } from "@/lib/domain";
import { useSubmitForm } from "@/components/useSubmitForm";
import { useToast } from "@/hooks/use-toast";

export default function AtlasVariant() {
  const { role, theme } = useAppState();
  const tone = theme === "dark" ? "dark" : "light";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="atlas-root">
      <header className="border-b atlas-divider" role="banner">
        <div className="mx-auto grid max-w-screen-xl grid-cols-3 items-center px-8 py-5">
          <div className="flex items-center gap-3 justify-self-start">
            <BookOpen className="h-5 w-5 text-[hsl(var(--atlas-accent))]" aria-hidden="true" />
            <div>
              <div className="text-[15px] font-semibold tracking-tight">Atlas</div>
              <div className="text-[11px] text-[hsl(var(--atlas-ink-dim))]">Cross-SBU prioritization registry</div>
            </div>
          </div>
          <div className="justify-self-center">
            <RoleSwitcher tone={tone} />
          </div>
          <div className="flex items-center gap-2 justify-self-end">
            <ThemeToggle tone={tone} />
            <ResetButton tone={tone} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-8 py-8">
        {role === "requestor" && <AtlasSubmit />}
        {role === "reviewer" && <AtlasReview />}
        {role === "stakeholder" && <AtlasVisibility />}
      </main>
    </motion.div>
  );
}

/* -------------------- SUBMIT -------------------- */
function AtlasSubmit() {
  const f = useSubmitForm();
  return (
    <div className="grid grid-cols-12 gap-10">
      <section className="col-span-12 lg:col-span-8">
        <div className="mb-1 flex items-start justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Submit a request</h1>
          <ImportDialog tone="light" />
        </div>
        <p className="mb-8 text-sm text-[hsl(var(--atlas-ink-dim))]">All fields are required for prioritization eligibility.</p>

        <div className="space-y-6">
          <Row label="SBU"><Select value={f.form.sbu} onChange={(v) => f.setForm({ ...f.form, sbu: v as SBU })} options={SBUS as readonly string[]} /></Row>
          <Row label="Work item type"><Select value={f.form.work_item_type} onChange={(v) => f.setForm({ ...f.form, work_item_type: v as never })} options={WORK_ITEM_TYPES as readonly string[]} /></Row>
          <Row label="Title" hint="≤ 120 characters" error={f.errors.title}><input className="atlas-input" value={f.form.title} onChange={(e) => f.setForm({ ...f.form, title: e.target.value })} placeholder="Short, descriptive summary" /></Row>
          <Row label="Requested by (alias)" error={f.errors.requested_by}><input className="atlas-input" value={f.form.requested_by} onChange={(e) => f.setForm({ ...f.form, requested_by: e.target.value })} placeholder="jdoe" /></Row>
          <Row label="Description" error={f.errors.description}><textarea className="atlas-input min-h-[80px]" value={f.form.description} onChange={(e) => f.setForm({ ...f.form, description: e.target.value })} placeholder="What is the request? Context and dependencies." /></Row>
          <Row label="Business justification" error={f.errors.justification}><textarea className="atlas-input min-h-[100px]" value={f.form.justification} onChange={(e) => f.setForm({ ...f.form, justification: e.target.value })} placeholder="Why is this needed? Expected impact (CSAT, cost, TNT, etc.)" /></Row>
          <Row label="Classification"><Select value={f.form.classification} onChange={(v) => f.setForm({ ...f.form, classification: v as never })} options={CLASSIFICATIONS as readonly string[]} /></Row>
          <Row label="Target timeline"><Select value={f.form.target_timeline} onChange={(v) => f.setForm({ ...f.form, target_timeline: v as Timeline })} options={TIMELINES as readonly string[]} /></Row>
          <Row label="Estimated days" error={f.errors.estimated_days}>
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={365} className="atlas-input" value={f.form.estimated_days ?? ""} onChange={(e) => f.setForm({ ...f.form, estimated_days: e.target.value === "" ? null : Number(e.target.value) })} placeholder="—" />
              {f.aiSuggestedDays != null && f.form.estimated_days !== f.aiSuggestedDays && (
                <button type="button" onClick={f.acceptAiDays} className="whitespace-nowrap rounded-md border border-[hsl(var(--atlas-accent))] bg-[hsl(var(--atlas-accent))]/10 px-2 py-1 text-[11px] font-medium text-[hsl(var(--atlas-accent))]">AI: {f.aiSuggestedDays}d ✓</button>
              )}
            </div>
          </Row>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button disabled={!f.canSubmit} onClick={f.submit} className="inline-flex items-center gap-2 rounded-md bg-[hsl(var(--atlas-ink))] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
            {f.isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Submit to centralized backlog
          </button>
          <span className="text-xs text-[hsl(var(--atlas-ink-dim))]">
            {Object.keys(f.errors).length === 0 ? "All required fields complete." : `${Object.keys(f.errors).length} field(s) need attention.`}
          </span>
        </div>
      </section>

      <aside className="col-span-12 lg:col-span-4">
        <div className="sticky top-24 rounded-lg border atlas-divider atlas-paper p-5">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--atlas-ink-dim))]">
            <FileText className="h-3.5 w-3.5" /> AI Coaching
          </div>
          {f.coaching && <div className="text-sm text-[hsl(var(--atlas-ink-dim))]">Reviewing your justification…</div>}
          {!f.coaching && !f.coach && <div className="text-sm text-[hsl(var(--atlas-ink-dim))]">Start writing the justification — we'll surface missing signals here.</div>}
          {f.coach && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  f.coach.strength === "strong" ? "bg-[hsl(var(--atlas-success))]" :
                  f.coach.strength === "adequate" ? "bg-[hsl(var(--atlas-warn))]" : "bg-[hsl(var(--destructive))]"
                }`} />
                <span className="font-medium capitalize">{f.coach.strength}</span>
              </div>
              {f.coach.missing.length > 0 && (
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-wider text-[hsl(var(--atlas-ink-dim))]">Missing signals</div>
                  <div className="flex flex-wrap gap-1">{f.coach.missing.map((m) => <span key={m} className="rounded border atlas-divider px-2 py-0.5 text-[11px]">{m}</span>)}</div>
                </div>
              )}
              <div className="text-[hsl(var(--atlas-ink-dim))]">{f.coach.suggestion}</div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        {hint && !error && <span className="text-[11px] text-[hsl(var(--atlas-ink-dim))]">{hint}</span>}
        {error && <span className="text-[11px] text-[hsl(var(--destructive))]">{error}</span>}
      </div>
      {children}
    </label>
  );
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="atlas-input">{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
}

/* -------------------- REVIEW -------------------- */
function AtlasReview() {
  const { data, isLoading } = useRequests();
  useAutoScore(data, true);
  const update = useUpdateStatus();
  const [filterSbu, setFilterSbu] = useState<SBU | "all">("all");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<RequestWithScore | null>(null);
  const [explainState, setExplainState] = useState<{ loading: boolean; text: string } | null>(null);
  const [reviewSortCol, setReviewSortCol] = useState<"rank" | "title" | "sbu" | "score" | "confidence" | "status">("score");
  const [reviewSortDir, setReviewSortDir] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();

  const ranked = useMemo(() => {
    if (!data) return [];
    const f = data.filter((r) =>
      (filterSbu === "all" || r.sbu === filterSbu) &&
      (filterStatus === "all" || r.status === filterStatus) &&
      (search === "" || r.title.toLowerCase().includes(search.toLowerCase()))
    );
    const dir = reviewSortDir === "asc" ? 1 : -1;
    return [...f].sort((a, b) => {
      switch (reviewSortCol) {
        case "title": return a.title.localeCompare(b.title) * dir;
        case "sbu": return a.sbu.localeCompare(b.sbu) * dir;
        case "score": return ((a.score?.total ?? -1) - (b.score?.total ?? -1)) * dir;
        case "confidence": {
          const order = { high: 3, medium: 2, low: 1 } as const;
          return ((order[a.score?.confidence ?? "low"] ?? 0) - (order[b.score?.confidence ?? "low"] ?? 0)) * dir;
        }
        case "status": return a.status.localeCompare(b.status) * dir;
        case "rank":
        default:
          return ((b.score?.total ?? -1) - (a.score?.total ?? -1));
      }
    });
  }, [data, filterSbu, filterStatus, search, reviewSortCol, reviewSortDir]);

  const handleExplain = async (r: RequestWithScore) => {
    const idx = ranked.findIndex((x) => x.id === r.id);
    const next = ranked[idx + 1];
    if (!next || !r.score || !next.score) return;
    setExplainState({ loading: true, text: "" });
    try { setExplainState({ loading: false, text: await explainRanking(r, next) }); }
    catch { setExplainState({ loading: false, text: "Could not generate explanation right now." }); }
  };

  const toggleSort = (col: typeof reviewSortCol) => {
    if (reviewSortCol === col) setReviewSortDir(reviewSortDir === "asc" ? "desc" : "asc");
    else { setReviewSortCol(col); setReviewSortDir(col === "title" || col === "sbu" || col === "status" ? "asc" : "desc"); }
  };
  const SortI = ({ col }: { col: typeof reviewSortCol }) => reviewSortCol !== col ? <span className="inline-block w-3" aria-hidden="true" /> : reviewSortDir === "asc" ? <ArrowUp className="inline h-3 w-3" aria-label="sorted ascending" /> : <ArrowDown className="inline h-3 w-3" aria-label="sorted descending" />;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Centralized backlog</h1>
          <p className="text-sm text-[hsl(var(--atlas-ink-dim))]">{ranked.length} items · sortable columns</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(var(--atlas-ink-dim))]" />
            <input className="atlas-input !pl-8 !w-56" placeholder="Search title…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search by title" />
          </div>
          <select className="atlas-input !w-32" value={filterSbu} onChange={(e) => setFilterSbu(e.target.value as SBU | "all")} aria-label="Filter by SBU">
            <option value="all">All SBUs</option>
            {SBUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="atlas-input !w-36" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as Status | "all")} aria-label="Filter by status">
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border atlas-divider">
        <table className="w-full text-sm">
          <caption className="sr-only">Centralized backlog, sortable by column.</caption>
          <thead className="bg-[hsl(var(--atlas-paper))] text-left text-[11px] uppercase tracking-wider text-[hsl(var(--atlas-ink-dim))]">
            <tr>
              <th scope="col" className="px-4 py-2.5 w-12">#</th>
              <th scope="col" className="px-4 py-2.5"><button onClick={() => toggleSort("title")} className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-[hsl(var(--atlas-ink))]">Title <SortI col="title" /></button></th>
              <th scope="col" className="px-4 py-2.5 w-20"><button onClick={() => toggleSort("sbu")} className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-[hsl(var(--atlas-ink))]">SBU <SortI col="sbu" /></button></th>
              <th scope="col" className="px-4 py-2.5 w-28"><button onClick={() => toggleSort("score")} className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-[hsl(var(--atlas-ink))]">Score <SortI col="score" /></button></th>
              <th scope="col" className="px-4 py-2.5 w-28"><button onClick={() => toggleSort("confidence")} className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-[hsl(var(--atlas-ink))]">Confidence <SortI col="confidence" /></button></th>
              <th scope="col" className="px-4 py-2.5 w-32"><button onClick={() => toggleSort("status")} className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-[hsl(var(--atlas-ink))]">Status <SortI col="status" /></button></th>
              <th scope="col" className="px-4 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-[hsl(var(--atlas-ink-dim))]">Loading backlog…</td></tr>}
            {ranked.map((r, i) => (
              <tr key={r.id} onClick={() => setOpen(r)} className="cursor-pointer atlas-row border-t atlas-divider">
                <td className="px-4 py-3 text-[hsl(var(--atlas-ink-dim))] font-mono text-[11px]">{String(i + 1).padStart(2, "0")}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{r.title}</div>
                  <div className="text-[11px] text-[hsl(var(--atlas-ink-dim))]">{r.classification} · {r.target_timeline}</div>
                </td>
                <td className="px-4 py-3 text-[12px]">{r.sbu}</td>
                <td className="px-4 py-3 font-mono">{r.score ? <span className="font-semibold">{r.score.total}</span> : <Loader2 className="h-3 w-3 animate-spin" />}</td>
                <td className="px-4 py-3 text-[12px] capitalize">{r.score?.confidence ?? "—"}</td>
                <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                <td className="px-4 py-3 text-[hsl(var(--atlas-ink-dim))]"><ChevronRight className="h-4 w-4" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Drawer onClose={() => { setOpen(null); setExplainState(null); }}>
          <div className="mb-1 text-[11px] uppercase tracking-wider text-[hsl(var(--atlas-ink-dim))]">{open.sbu} · {open.classification}</div>
          <h2 className="mb-2 text-xl font-semibold tracking-tight">{open.title}</h2>
          <div className="mb-4 flex items-center gap-2"><StatusPill status={open.status} /></div>
          {open.score && (
            <div className="mb-5 rounded-md border atlas-divider atlas-paper p-4">
              <div className="mb-2 flex items-baseline justify-between">
                <div className="text-[11px] uppercase tracking-wider text-[hsl(var(--atlas-ink-dim))]">AI score</div>
                <div className="text-2xl font-semibold tabular-nums">{open.score.total}<span className="text-sm text-[hsl(var(--atlas-ink-dim))]">/100</span></div>
              </div>
              <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
                {(["impact","cost_avoidance","scale","strategic_alignment","feasibility"] as const).map((k) => (
                  <div key={k}>
                    <div className="text-[hsl(var(--atlas-ink-dim))] capitalize">{k.replace("_"," ")}</div>
                    <div className="font-mono font-semibold">{open.score![k]}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-[hsl(var(--atlas-ink-dim))]">{open.score.rationale}</p>
            </div>
          )}
          <Section title="Description">{open.description}</Section>
          <Section title="Justification">{open.justification}</Section>
          <Section title="Requested by">{open.requested_by}</Section>
          {open.sxg_ado_id && <Section title="SXG ADO">{open.sxg_ado_id}</Section>}
          {explainState && (
            <div className="mb-4 rounded border atlas-divider bg-[hsl(var(--atlas-paper))] p-3 text-sm">
              {explainState.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : explainState.text}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-2 border-t atlas-divider pt-4">
            <button
              onClick={async () => {
                await update.mutateAsync({ id: open.id, status: "approved" });
                await update.mutateAsync({ id: open.id, status: "handed_off" });
                toast({ title: "Approved & handed off", description: "SXG ADO created automatically." });
                setOpen(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--atlas-success))] px-3 py-1.5 text-sm font-medium text-white"
            >
              <Check className="h-3.5 w-3.5" /> Approve & hand off
            </button>
            <button onClick={async () => { await update.mutateAsync({ id: open.id, status: "deferred" }); setOpen(null); }} className="rounded-md border atlas-divider px-3 py-1.5 text-sm">Defer</button>
            <button onClick={() => handleExplain(open)} className="ml-auto rounded-md border atlas-divider px-3 py-1.5 text-sm">Explain rank vs next</button>
          </div>
        </Drawer>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-[hsl(var(--atlas-ink-dim))]">{title}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    submitted: "bg-gray-100 text-gray-700",
    scored: "bg-blue-50 text-blue-700",
    in_review: "bg-purple-50 text-purple-700",
    approved: "bg-green-50 text-green-700",
    handed_off: "bg-slate-900 text-white",
    deferred: "bg-amber-50 text-amber-700",
  };
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${map[status]}`}>{STATUS_LABEL[status]}</span>;
}
function Drawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" />
      <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.15 }} onClick={(e) => e.stopPropagation()} className="relative h-full w-full max-w-lg overflow-y-auto bg-white p-8 pt-14 shadow-xl">
        <button onClick={onClose} aria-label="Close panel" className="absolute right-4 top-4 rounded p-1.5 text-[hsl(var(--atlas-ink-dim))] hover:text-[hsl(var(--atlas-ink))]">
          <X className="h-4 w-4" />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

/* -------------------- VISIBILITY -------------------- */
const FILTERABLE: Status[] = ["in_review", "approved", "handed_off", "deferred"];
type SortCol = "date" | "score" | "sbu" | "status" | "title";
type SortDir = "asc" | "desc";

function AtlasVisibility() {
  const { data } = useRequests();
  const update = useUpdateStatus();
  const { toast } = useToast();
  const [activeFilters, setActiveFilters] = useState<Set<Status>>(new Set());
  const [sortCol, setSortCol] = useState<SortCol>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [open, setOpen] = useState<RequestWithScore | null>(null);

  const counts = useMemo(() => {
    const c: Record<Status, number> = { submitted: 0, scored: 0, in_review: 0, approved: 0, handed_off: 0, deferred: 0 };
    (data ?? []).forEach((r) => { c[r.status]++; });
    return c;
  }, [data]);

  const recent = useMemo(() => {
    let rows = [...(data ?? [])];
    if (activeFilters.size > 0) rows = rows.filter((r) => activeFilters.has(r.status));
    rows.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortCol === "score") return ((a.score?.total ?? -1) - (b.score?.total ?? -1)) * dir;
      if (sortCol === "sbu") return a.sbu.localeCompare(b.sbu) * dir;
      if (sortCol === "status") return a.status.localeCompare(b.status) * dir;
      if (sortCol === "title") return a.title.localeCompare(b.title) * dir;
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
    });
    return rows.slice(0, 24);
  }, [data, activeFilters, sortCol, sortDir]);

  const toggleFilter = (s: Status) => {
    const next = new Set(activeFilters);
    next.has(s) ? next.delete(s) : next.add(s);
    setActiveFilters(next);
  };
  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir(col === "title" || col === "sbu" || col === "status" ? "asc" : "desc"); }
  };
  const SortIcon = ({ col }: { col: SortCol }) => sortCol !== col ? null : sortDir === "asc" ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Pipeline status</h1>
      <p className="mb-8 text-sm text-[hsl(var(--atlas-ink-dim))]">Read-only view of all SBU requests across the lifecycle.</p>

      <div className="mb-8 grid grid-cols-6 gap-3">
        {STATUSES.map((s) => {
          const isFilterable = FILTERABLE.includes(s);
          const active = activeFilters.has(s);
          return (
            <button
              key={s}
              onClick={() => isFilterable && toggleFilter(s)}
              disabled={!isFilterable}
              className={`rounded-lg border atlas-divider atlas-paper p-4 text-left transition-colors ${
                isFilterable ? "cursor-pointer hover:border-[hsl(var(--atlas-accent))]/40" : "cursor-default opacity-70"
              } ${active ? "!border-[hsl(var(--atlas-accent))] !bg-[hsl(var(--atlas-accent))]/10" : ""}`}
            >
              <div className="text-[11px] uppercase tracking-wider text-[hsl(var(--atlas-ink-dim))]">{STATUS_LABEL[s]}</div>
              <div className={`mt-1 text-2xl font-semibold tabular-nums ${active ? "text-[hsl(var(--atlas-accent))]" : ""}`}>{counts[s]}</div>
              {isFilterable && <div className="mt-1 text-[10px] text-[hsl(var(--atlas-ink-dim))]/70">{active ? "filter active" : "click to filter"}</div>}
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--atlas-ink-dim))]">Workplan</h2>
        <div className="flex items-center gap-2">
          {activeFilters.size > 0 && (
            <button onClick={() => setActiveFilters(new Set())} className="text-xs text-[hsl(var(--atlas-ink-dim))] hover:text-[hsl(var(--atlas-ink))]">
              clear filters ({activeFilters.size})
            </button>
          )}
          <ReportButton tone={"light"} />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border atlas-divider">
        <table className="w-full text-sm">
          <caption className="sr-only">Workplan, sortable and filterable.</caption>
          <thead className="bg-[hsl(var(--atlas-paper))] text-left text-[11px] uppercase tracking-wider text-[hsl(var(--atlas-ink-dim))]">
            <tr>
              <th scope="col" className="px-4 py-2.5 cursor-pointer hover:text-[hsl(var(--atlas-ink))]" onClick={() => toggleSort("title")}>Title <SortIcon col="title" /></th>
              <th scope="col" className="px-4 py-2.5 w-24 cursor-pointer hover:text-[hsl(var(--atlas-ink))]" onClick={() => toggleSort("sbu")}>SBU <SortIcon col="sbu" /></th>
              <th scope="col" className="px-4 py-2.5 w-44">Target timeline</th>
              <th scope="col" className="px-4 py-2.5 w-24 cursor-pointer hover:text-[hsl(var(--atlas-ink))]" onClick={() => toggleSort("date")}>Date <SortIcon col="date" /></th>
              <th scope="col" className="px-4 py-2.5 w-20 cursor-pointer hover:text-[hsl(var(--atlas-ink))]" onClick={() => toggleSort("score")}>Score <SortIcon col="score" /></th>
              <th scope="col" className="px-4 py-2.5 w-28 cursor-pointer hover:text-[hsl(var(--atlas-ink))]" onClick={() => toggleSort("status")}>Status <SortIcon col="status" /></th>
              <th scope="col" className="px-4 py-2.5 w-24">ADO</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id} onClick={() => setOpen(r)} className="cursor-pointer atlas-row border-t atlas-divider">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.title}</div>
                  <div className="text-[11px] text-[hsl(var(--atlas-ink-dim))]">{r.classification}</div>
                </td>
                <td className="px-4 py-3 text-[12px]">{r.sbu}</td>
                <td className="px-4 py-3 text-[11px]">
                  <span className="inline-flex items-center rounded border atlas-divider bg-[hsl(var(--atlas-paper))] px-2 py-0.5">{r.target_timeline}</span>
                </td>
                <td className="px-4 py-3 text-[11px] text-[hsl(var(--atlas-ink-dim))]">
                  <Clock className="inline h-3 w-3 mr-1" aria-hidden="true" />{new Date(r.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 font-mono">{r.score?.total ?? "—"}</td>
                <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                <td className="px-4 py-3 text-[11px]">{(r.ado_id || r.sxg_ado_id) && <span className="inline-flex items-center gap-1 text-[hsl(var(--atlas-accent))]">{r.sxg_ado_id ?? r.ado_id}<ArrowUpRight className="h-3 w-3" /></span>}</td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-[hsl(var(--atlas-ink-dim))]">No items match active filters</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <Drawer onClose={() => setOpen(null)}>
          <div className="mb-1 text-[11px] uppercase tracking-wider text-[hsl(var(--atlas-ink-dim))]">{open.sbu} · {open.classification}</div>
          <h2 className="mb-2 text-xl font-semibold tracking-tight">{open.title}</h2>
          <div className="mb-4 flex items-center gap-2"><StatusPill status={open.status} /></div>
          <Section title="Description">{open.description}</Section>
          <Section title="Justification">{open.justification}</Section>
          <Section title="Requested by">{open.requested_by}</Section>
          <Section title="Target timeline">{open.target_timeline}</Section>
          {open.estimated_days != null && <Section title="Estimated days">{open.estimated_days}</Section>}
          {open.ado_id && <Section title="ADO ID">{open.ado_id}</Section>}
          {open.sxg_ado_id && <Section title="SXG ADO">{open.sxg_ado_id}</Section>}
        </Drawer>
      )}
    </div>
  );
}
