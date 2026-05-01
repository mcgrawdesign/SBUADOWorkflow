import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

export function ReportButton({ tone = "light" }: { tone?: "light" | "dark" | "council" }) {
  const styles =
    tone === "dark"
      ? "bg-white/5 border border-white/10 hover:bg-white/10 text-primary"
      : tone === "council"
      ? "border border-[hsl(var(--council-line))] text-[hsl(var(--council-text-dim))] hover:text-[hsl(var(--council-gold))]"
      : "border border-[hsl(var(--atlas-line))] bg-white text-[hsl(var(--atlas-ink-dim))] hover:text-[hsl(var(--atlas-ink))]";
  return (
    <Link
      to="/report"
      aria-label="Generate report"
      title="Generate report"
      className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-colors ${styles}`}
    >
      <FileText className="h-3.5 w-3.5" />
      Report
    </Link>
  );
}
