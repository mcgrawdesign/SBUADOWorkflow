import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, FileText, Loader2, Presentation, Send } from "lucide-react";
import { useAppState } from "@/lib/appState";
import { buildReport } from "@/lib/useRequests";
import { exportReportPDF } from "@/lib/exporters/pdf";
import { exportReportPPT } from "@/lib/exporters/pptx";
import { ROLE_LABEL, STATUS_LABEL } from "@/lib/domain";
import { useToast } from "@/hooks/use-toast";

type Report = Awaited<ReturnType<typeof buildReport>>;

export default function ReportPage() {
  const { role, variant } = useAppState();
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        setData(await buildReport(role));
      } catch (e) {
        toast({ title: "Could not load report", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
      } finally { setLoading(false); }
    })();
  }, [role, toast]);

  const tone = variant === "atlas" ? "atlas" : variant === "council" ? "council" : "signal";

  return (
    <div className={`report-root report-${tone} min-h-screen`}>
      <div className="mx-auto max-w-5xl px-8 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm opacity-70 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> Back to {variant}
          </Link>
          <div className="flex gap-2">
            <button
              disabled={!data}
              onClick={() => data && exportReportPDF(data)}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-foreground/5 disabled:opacity-40"
            >
              <Download className="h-4 w-4" /> PDF
            </button>
            <button
              disabled={!data}
              onClick={() => data && exportReportPPT(data)}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-foreground/5 disabled:opacity-40"
            >
              <Presentation className="h-4 w-4" /> PowerPoint
            </button>
            <button
              disabled={!data}
              onClick={() => {
                if (!data) return;
                const n = (data.handed_off?.length ?? 0) || data.totals.all;
                toast({ title: "Published to ADO", description: `${n} item${n === 1 ? "" : "s"} queued for sync.` });
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" /> Publish to ADO
            </button>
          </div>
        </div>

        <div className="mb-1 text-[11px] uppercase tracking-[0.25em] opacity-60">Prioritization report</div>
        <h1 className="report-title text-4xl font-semibold tracking-tight">Cross-SBU Tech Debt</h1>
        <p className="mt-2 text-sm opacity-70">
          Generated {data ? new Date(data.generated_at).toLocaleString() : "—"} · viewed as <strong>{ROLE_LABEL[role]}</strong>
        </p>

        {loading && (
          <div className="mt-12 flex items-center gap-2 opacity-70"><Loader2 className="h-4 w-4 animate-spin" /> Building report…</div>
        )}

        {data && (
          <div className="mt-10 space-y-10">
            <Section title="Pipeline overview" icon={<FileText className="h-4 w-4" />}>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {Object.entries(data.totals.by_status).map(([k, v]) => (
                  <div key={k} className="rounded-md border p-4">
                    <div className="text-[11px] uppercase tracking-wider opacity-60">{STATUS_LABEL[k as keyof typeof STATUS_LABEL] ?? k}</div>
                    <div className="mt-1 text-2xl font-semibold">{v as number}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {Object.entries(data.totals.by_sbu).map(([k, v]) => (
                  <span key={k} className="rounded-full border px-3 py-1">{k}: <strong>{v as number}</strong></span>
                ))}
              </div>
            </Section>

            <Section title={`Top ${Math.min(10, data.top.length)} by score`}>
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider opacity-60">
                  <tr><th className="py-2">#</th><th>Title</th><th>SBU</th><th>Status</th><th>Score</th></tr>
                </thead>
                <tbody>
                  {data.top.map((r, i) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 font-mono opacity-60">{String(i + 1).padStart(2, "0")}</td>
                      <td className="py-2">{r.title}</td>
                      <td className="py-2">{r.sbu}</td>
                      <td className="py-2 opacity-70">{STATUS_LABEL[r.status as keyof typeof STATUS_LABEL] ?? r.status}</td>
                      <td className="py-2 font-mono">{r.score?.total ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            {data.decisions.length > 0 && (
              <Section title={`Decisions log (${data.decisions.length})`}>
                <ul className="space-y-2">
                  {data.decisions.slice(0, 20).map((d, i) => (
                    <li key={i} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{d.outcome}</span>
                        <span className="text-xs opacity-60">{new Date(d.decided_at).toLocaleString()}</span>
                      </div>
                      <div className="text-xs opacity-70">{d.reviewer_alias}{d.notes ? ` · ${d.notes}` : ""}</div>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {data.deferred.length > 0 && (
              <Section title={`Deferred (${data.deferred.length})`}>
                <ul className="space-y-1 text-sm">
                  {data.deferred.map((r) => (
                    <li key={r.id} className="flex items-center justify-between border-b py-2">
                      <span>{r.title}</span><span className="text-xs opacity-60">{r.sbu}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>
      {children}
    </section>
  );
}
